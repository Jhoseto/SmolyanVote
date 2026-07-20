package smolyanVote.smolyanVote.config;

import org.springframework.context.annotation.Configuration;
import org.springframework.data.web.config.EnableSpringDataWebSupport;
import org.springframework.http.CacheControl;
import org.springframework.web.servlet.config.annotation.ResourceHandlerRegistry;
import org.springframework.web.servlet.config.annotation.WebMvcConfigurer;
import static org.springframework.data.web.config.EnableSpringDataWebSupport.PageSerializationMode.VIA_DTO;

import java.util.concurrent.TimeUnit;

@Configuration
@EnableSpringDataWebSupport(pageSerializationMode = VIA_DTO)
public class WebConfig implements WebMvcConfigurer {

        /**
         * Only assets still referenced by API DTOs / SEO on the API host.
         * Legacy page css/js were removed — Next serves its own UI.
         */
        @Override
        public void addResourceHandlers(ResourceHandlerRegistry registry) {
                registry.addResourceHandler("/images/**", "/fonts/**")
                                .addResourceLocations("classpath:/static/images/", "classpath:/static/fonts/")
                                .setCacheControl(CacheControl.maxAge(365, TimeUnit.DAYS)
                                                .cachePublic()
                                                .mustRevalidate());

                registry.addResourceHandler("/favicon.ico", "/robots.txt", "/sitemap.xml")
                                .addResourceLocations("classpath:/static/")
                                .setCacheControl(CacheControl.maxAge(7, TimeUnit.DAYS)
                                                .cachePublic());

                registry.addResourceHandler("/svmessenger/sounds/**", "/svmessenger/img/**")
                                .addResourceLocations("classpath:/static/svmessenger/sounds/",
                                                "classpath:/static/svmessenger/img/")
                                .setCacheControl(CacheControl.maxAge(30, TimeUnit.DAYS).cachePublic());
        }
}
