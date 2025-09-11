package com.wittybrains.security;

import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;

@Component
public class TokenAuthFilter extends OncePerRequestFilter {

    // simple in-memory token store (token -> role)
    public static final Map<String, String> TOKENS = new ConcurrentHashMap<>();

    @Override
    protected void doFilterInternal(HttpServletRequest request, HttpServletResponse response, FilterChain filterChain) throws ServletException, IOException {
        String auth = request.getHeader("Authorization");
        if (auth != null && auth.startsWith("Bearer ")) {
            String token = auth.substring(7);
            String role = TOKENS.get(token);
            if (role != null) {
                // set simple attribute for controllers to use
                request.setAttribute("role", role);
                request.setAttribute("token", token);
            }
        }
        filterChain.doFilter(request, response);
    }
}
