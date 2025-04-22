package smolyanVote.smolyanVote.config;

import org.springframework.context.annotation.Configuration;
import org.springframework.web.servlet.config.annotation.CorsRegistry;
import org.springframework.web.servlet.config.annotation.ResourceHandlerRegistry;
import org.springframework.web.servlet.config.annotation.WebMvcConfigurer;


@Configuration
public class WebConfig implements WebMvcConfigurer {

    @Override
    public void addCorsMappings(CorsRegistry registry) {
        registry.addMapping("/**")
                .allowedOriginPatterns("http://213.91.128.33:2662")
                .allowedMethods("GET", "POST", "PUT", "DELETE", "OPTIONS")
                .allowCredentials(true)
                .maxAge(3600);
    }
//http://localhost:8080
//http://213.91.128.33:2662

////TODO ВАЖНО !!!
//// Изключване на кеширането на статичните ресурси в тази директория за
//// да може да се актуализират профилните снимки от потребителите.
//// Единствения вариант за сега...
//    @Override
//    public void addResourceHandlers(ResourceHandlerRegistry registry) {
//        registry.addResourceHandler("/images/usersImg/**")
//                .addResourceLocations("file:/D:/MyProjectsJAVA/SamarBG/SamarBg/src/main/resources/static/images/usersImg/")
//                .setCachePeriod(0); // изключва кеширането
//
//        registry.addResourceHandler("/images/offerImg/**")
//                .addResourceLocations("file:/D:/MyProjectsJAVA/SamarBG/SamarBg/src/main/resources/static/images/offerImg/")
//                .setCachePeriod(0); // изключва кеширането
//    }
}

