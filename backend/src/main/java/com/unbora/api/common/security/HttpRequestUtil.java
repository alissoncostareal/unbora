package com.unbora.api.common.security;

import jakarta.servlet.http.HttpServletRequest;
import org.springframework.web.context.request.RequestContextHolder;
import org.springframework.web.context.request.ServletRequestAttributes;

import java.util.regex.Pattern;

public final class HttpRequestUtil {

    private static final String[] IP_HEADER_CANDIDATES = {
            "CF-Connecting-IP",      // Cloudflare
            "X-Forwarded-For",       // Standard Proxy / K8s Ingress
            "X-Real-IP",             // Nginx
            "Proxy-Client-IP",
            "WL-Proxy-Client-IP",
            "HTTP_X_FORWARDED_FOR",
            "HTTP_X_FORWARDED",
            "HTTP_X_CLUSTER_CLIENT_IP",
            "HTTP_CLIENT_IP",
            "HTTP_FORWARDED_FOR",
            "HTTP_FORWARDED",
            "HTTP_VIA",
            "REMOTE_ADDR"
    };

    private static final Pattern IPV4_PATTERN = Pattern.compile("^([0-9]{1,3}\\.){3}[0-9]{1,3}$");

    private HttpRequestUtil() {}

    public static String getClientIp() {
        try {
            ServletRequestAttributes attributes = (ServletRequestAttributes) RequestContextHolder.getRequestAttributes();
            if (attributes != null) {
                return getClientIp(attributes.getRequest());
            }
        } catch (Exception ignored) {
        }
        return "127.0.0.1";
    }

    public static String getClientIp(HttpServletRequest request) {
        if (request == null) {
            return "127.0.0.1";
        }

        for (String header : IP_HEADER_CANDIDATES) {
            String ipList = request.getHeader(header);
            if (ipList != null && !ipList.isBlank() && !"unknown".equalsIgnoreCase(ipList.trim())) {
                // X-Forwarded-For may contain multiple comma-separated IPs (client, proxy1, proxy2...)
                String[] ips = ipList.split(",");
                for (String ip : ips) {
                    String candidate = ip.trim();
                    if (!candidate.isBlank() && !"unknown".equalsIgnoreCase(candidate)) {
                        return candidate;
                    }
                }
            }
        }

        String remoteAddr = request.getRemoteAddr();
        return (remoteAddr != null && !remoteAddr.isBlank()) ? remoteAddr : "127.0.0.1";
    }
}
