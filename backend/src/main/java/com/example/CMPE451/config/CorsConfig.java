package com.example.CMPE451.config;

import org.springframework.context.annotation.Configuration;
import org.springframework.web.servlet.config.annotation.CorsRegistry;
import org.springframework.web.servlet.config.annotation.WebMvcConfigurer;

@Configuration
public class CorsConfig implements WebMvcConfigurer {

    @Override
    public void addCorsMappings(CorsRegistry registry) {
        registry.addMapping("/**")

                /*  Accept the origins you actually hit in dev.
                 *  Use patterns instead of allowedOrigins(..) so credentials
                 *  still work while matching http / https and LAN IPs.
                 */
                .allowedOriginPatterns(
                        "http://localhost:5173",
                        "http://127.0.0.1:5173",
                        "http://localhost:8081",
                        "http://localhost:3000",
                        "http://127.0.0.1:8081",
                        "http://192.168.*:*"      // Expo on physical device
                )

                /*  Pre‑flight will fail if PATCH or OPTIONS are missing.  */
                .allowedMethods("GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS")

                /*  Let any requested header through; you can whitelist if you prefer. */
                .allowedHeaders("*")

                /*  Expose any custom headers you need on the client side. */
                .exposedHeaders("Authorization", "Content-Disposition")

                /*  Required when you fetch with credentials: 'include'. */
                .allowCredentials(true)

                /*  Cache the pre‑flight result for one hour. */
                .maxAge(3600);
    }
}
