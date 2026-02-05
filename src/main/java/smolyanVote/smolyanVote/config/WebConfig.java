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
        // CORS configuration moved to ApplicationSecurityConfiguration

        /**
         * Конфигурация за кеширане на static resources за SEO и performance
         */
        @Override
        public void addResourceHandlers(ResourceHandlerRegistry registry) {
                // CSS, JS, Images - дълго кеширане (1 година)
                registry.addResourceHandler("/css/**", "/js/**", "/images/**", "/fonts/**")
                                .addResourceLocations("classpath:/static/css/", "classpath:/static/js/",
                                                "classpath:/static/images/", "classpath:/static/fonts/")
                                .setCacheControl(CacheControl.maxAge(365, TimeUnit.DAYS)
                                                .cachePublic()
                                                .mustRevalidate());

                // Favicon и други малки файлове
                registry.addResourceHandler("/favicon.ico", "/robots.txt", "/sitemap.xml")
                                .addResourceLocations("classpath:/static/")
                                .setCacheControl(CacheControl.maxAge(7, TimeUnit.DAYS)
                                                .cachePublic());

                // Virtual Major Game Assets
                registry.addResourceHandler("/virtual-mayor-assets/**")
                                .addResourceLocations("classpath:/static/virtual-mayor/");

                // Virtual Major Game (Iframe Content)
                registry.addResourceHandler("/virtual-mayor-game.html", "/virtual-mayor-game/**")
                                .addResourceLocations("classpath:/static/virtual-mayor-game/");
        }
}