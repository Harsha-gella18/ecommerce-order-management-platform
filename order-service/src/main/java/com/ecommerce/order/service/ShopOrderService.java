package com.ecommerce.order.service;

import com.ecommerce.order.dto.CreateOrderRequest;
import com.ecommerce.order.dto.UpdateStatusRequest;
import com.ecommerce.order.integration.CartClient;
import com.ecommerce.order.integration.InventoryClient;
import com.ecommerce.order.integration.PaymentClient;
import com.ecommerce.order.integration.UserProfileClient;
import com.ecommerce.order.messaging.DomainEventPublisher;
import com.ecommerce.order.model.OrderLine;
import com.ecommerce.order.model.ShopOrder;
import com.ecommerce.order.repository.OrderRepository;
import com.ecommerce.order.security.OrderAuthInterceptor;
import javax.servlet.http.HttpServletRequest;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.util.StringUtils;
import org.springframework.web.server.ResponseStatusException;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.stream.Collectors;

@Service
public class ShopOrderService {
    private static final Set<String> STATUSES = Set.of(
            "PLACED", "CONFIRMED", "PACKED", "SHIPPED", "DELIVERED", "CANCELLED");

    private final OrderRepository orderRepository;
    private final CartClient cartClient;
    private final InventoryClient inventoryClient;
    private final PaymentClient paymentClient;
    private final DomainEventPublisher eventPublisher;
    private final UserProfileClient userProfileClient;

    public ShopOrderService(
            OrderRepository orderRepository,
            CartClient cartClient,
            InventoryClient inventoryClient,
            PaymentClient paymentClient,
            DomainEventPublisher eventPublisher,
            UserProfileClient userProfileClient) {
        this.orderRepository = orderRepository;
        this.cartClient = cartClient;
        this.inventoryClient = inventoryClient;
        this.paymentClient = paymentClient;
        this.eventPublisher = eventPublisher;
        this.userProfileClient = userProfileClient;
    }

    @SuppressWarnings("unchecked")
    public ShopOrder create(String authHeader, String userId, CreateOrderRequest req) {
        Map<String, Object> cart;
        try {
            cart = cartClient.getCart(authHeader);
        } catch (Exception e) {
            throw new ResponseStatusException(HttpStatus.BAD_GATEWAY, "Cart service unavailable");
        }
        if (cart == null) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Empty cart");
        }
        List<Map<String, Object>> rawItems = (List<Map<String, Object>>) cart.get("items");
        if (rawItems == null || rawItems.isEmpty()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Cart is empty");
        }

        List<Map<String, Object>> checkItems = new ArrayList<>();
        List<OrderLine> lines = new ArrayList<>();
        BigDecimal total = BigDecimal.ZERO;
        for (Map<String, Object> ri : rawItems) {
            String productId = String.valueOf(ri.get("productId"));
            int qty = ((Number) ri.get("quantity")).intValue();
            checkItems.add(Map.of("productId", productId, "quantity", qty));
            OrderLine line = new OrderLine();
            line.setProductId(productId);
            line.setProductName(ri.get("name") != null ? String.valueOf(ri.get("name")) : productId);
            Object priceObj = ri.get("price");
            BigDecimal unit = priceObj instanceof Number
                    ? BigDecimal.valueOf(((Number) priceObj).doubleValue())
                    : new BigDecimal(priceObj.toString());
            line.setQuantity(qty);
            line.setUnitPrice(unit);
            lines.add(line);
            total = total.add(unit.multiply(BigDecimal.valueOf(qty)));
        }

        if (!inventoryClient.check(authHeader, checkItems)) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "Insufficient inventory");
        }

        String shippingLine = resolveShipping(authHeader, req);

        ShopOrder order = new ShopOrder();
        order.setCustomerId(userId);
        order.setStatus("PLACED");
        order.setItems(lines);
        order.setTotalAmount(total);
        order.setShippingAddress(shippingLine);
        if (StringUtils.hasText(req.getShippingAddressId())) {
            order.setShippingAddressId(req.getShippingAddressId().trim());
        }
        order.setPaymentStatus("PENDING");
        order.setCreatedAt(Instant.now());
        order.setUpdatedAt(Instant.now());
        order = orderRepository.save(order);

        eventPublisher.publish("order.placed", Map.of(
                "orderId", order.getId(),
                "userId", userId,
                "total", total.doubleValue(),
                "type", "ORDER_PLACED"));

        boolean payOk = Boolean.TRUE.equals(req.getSimulatePaymentSuccess());
        Map<String, Object> pay;
        try {
            pay = paymentClient.createPayment(authHeader, order.getId(), total, userId, payOk);
        } catch (Exception e) {
            order.setStatus("CANCELLED");
            order.setPaymentStatus("FAILED");
            order.setUpdatedAt(Instant.now());
            orderRepository.save(order);
            throw new ResponseStatusException(HttpStatus.BAD_GATEWAY, "Payment service error");
        }

        String paymentId = pay != null && pay.get("id") != null ? String.valueOf(pay.get("id")) : null;
        String payStatus = pay != null && pay.get("status") != null ? String.valueOf(pay.get("status")) : "FAILED";
        order.setPaymentId(paymentId);
        order.setPaymentStatus(payStatus);

        if ("SUCCESS".equals(payStatus)) {
            order.setStatus("CONFIRMED");
            inventoryClient.reduce(authHeader, checkItems);
            try {
                cartClient.clearCart(authHeader);
            } catch (Exception ignored) {
            }
        } else {
            order.setStatus("CANCELLED");
        }
        order.setUpdatedAt(Instant.now());
        order = orderRepository.save(order);
        return order;
    }

    private String resolveShipping(String authHeader, CreateOrderRequest req) {
        if (StringUtils.hasText(req.getShippingAddressId())) {
            return userProfileClient.resolveShippingAddress(authHeader, req.getShippingAddressId().trim());
        }
        if (StringUtils.hasText(req.getShippingAddress())) {
            return req.getShippingAddress().trim();
        }
        throw new ResponseStatusException(
                HttpStatus.BAD_REQUEST, "Select a saved address or enter a shipping address");
    }

    public List<ShopOrder> myOrders(String userId) {
        return orderRepository.findByCustomerIdOrderByCreatedAtDesc(userId);
    }

    public List<ShopOrder> allOrdersAdmin() {
        return orderRepository.findAll().stream()
                .sorted((a, b) -> {
                    if (a.getCreatedAt() == null) return 1;
                    if (b.getCreatedAt() == null) return -1;
                    return b.getCreatedAt().compareTo(a.getCreatedAt());
                })
                .collect(Collectors.toList());
    }

    public ShopOrder getById(HttpServletRequest request, String id) {
        String userId = (String) request.getAttribute(OrderAuthInterceptor.ATTR_USER_ID);
        String role = (String) request.getAttribute(OrderAuthInterceptor.ATTR_ROLE);
        ShopOrder o = orderRepository.findById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Order not found"));
        if (!"ADMIN".equals(role) && !userId.equals(o.getCustomerId())) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Not your order");
        }
        return o;
    }

    public ShopOrder updateStatus(HttpServletRequest request, String id, UpdateStatusRequest body) {
        if (!"ADMIN".equals(request.getAttribute(OrderAuthInterceptor.ATTR_ROLE))) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Admin only");
        }
        String s = body.getStatus().toUpperCase();
        if (!STATUSES.contains(s)) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Invalid status");
        }
        ShopOrder o = orderRepository.findById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Order not found"));
        o.setStatus(s);
        o.setUpdatedAt(Instant.now());
        o = orderRepository.save(o);
        eventPublisher.publish("order.status", Map.of(
                "orderId", o.getId(),
                "userId", o.getCustomerId(),
                "status", s,
                "type", "ORDER_STATUS"));
        return o;
    }

    public ShopOrder cancel(HttpServletRequest request, String id) {
        String userId = (String) request.getAttribute(OrderAuthInterceptor.ATTR_USER_ID);
        String role = (String) request.getAttribute(OrderAuthInterceptor.ATTR_ROLE);
        ShopOrder o = orderRepository.findById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Order not found"));
        if (!"ADMIN".equals(role) && !userId.equals(o.getCustomerId())) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Not your order");
        }
        if ("SHIPPED".equals(o.getStatus()) || "DELIVERED".equals(o.getStatus()) || "CANCELLED".equals(o.getStatus())) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "Cannot cancel order in this state");
        }
        o.setStatus("CANCELLED");
        o.setUpdatedAt(Instant.now());
        o = orderRepository.save(o);
        eventPublisher.publish("order.cancelled", Map.of(
                "orderId", o.getId(),
                "userId", o.getCustomerId(),
                "type", "ORDER_CANCELLED"));
        return o;
    }

    /** Plain-text invoice for download (customer or admin with access to the order). */
    public String renderInvoice(ShopOrder o) {
        StringBuilder sb = new StringBuilder();
        sb.append("NEXUS — INVOICE (INR)\n");
        sb.append("=====================\n\n");
        sb.append("Order ID: ").append(o.getId()).append("\n");
        sb.append("Customer: ").append(o.getCustomerId()).append("\n");
        sb.append("Status: ").append(o.getStatus()).append("\n");
        sb.append("Payment: ").append(o.getPaymentStatus() != null ? o.getPaymentStatus() : "—").append("\n");
        if (o.getPaymentId() != null) {
            sb.append("Payment ID: ").append(o.getPaymentId()).append("\n");
        }
        sb.append("\nShip to:\n").append(o.getShippingAddress() != null ? o.getShippingAddress() : "—").append("\n\n");
        sb.append("Line items (amounts in INR):\n");
        for (OrderLine line : o.getItems()) {
            sb.append("  - ")
                    .append(line.getProductName())
                    .append(" x ")
                    .append(line.getQuantity())
                    .append(" @ INR ")
                    .append(line.getUnitPrice())
                    .append(" = INR ")
                    .append(line.getUnitPrice().multiply(java.math.BigDecimal.valueOf(line.getQuantity())))
                    .append("\n");
        }
        sb.append("\nTotal (INR): ").append(o.getTotalAmount()).append("\n");
        if (o.getCreatedAt() != null) {
            sb.append("\nPlaced: ").append(o.getCreatedAt()).append("\n");
        }
        return sb.toString();
    }
}
