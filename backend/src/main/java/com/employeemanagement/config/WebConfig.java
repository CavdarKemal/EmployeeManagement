package com.employeemanagement.config;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Configuration;
import org.springframework.web.servlet.config.annotation.ResourceHandlerRegistry;
import org.springframework.web.servlet.config.annotation.WebMvcConfigurer;

@Configuration
public class WebConfig implements WebMvcConfigurer {

    @Value("${app.upload.dir:./uploads/photos}")
    private String uploadDir;

    @Override
    public void addResourceHandlers(ResourceHandlerRegistry registry) {
        String photoDir = uploadDir.endsWith("/photos") ? uploadDir : uploadDir + "/photos";
        registry.addResourceHandler("/uploads/photos/**")
                .addResourceLocations("file:" + photoDir + "/");
    }
}
