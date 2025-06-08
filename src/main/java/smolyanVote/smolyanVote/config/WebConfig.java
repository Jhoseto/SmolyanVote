package smolyanVote.smolyanVote.config;

import org.springframework.context.annotation.Configuration;
import org.springframework.web.servlet.config.annotation.CorsRegistry;
import org.springframework.web.servlet.config.annotation.WebMvcConfigurer;


@Configuration
public class WebConfig implements WebMvcConfigurer {

    @Override
    public void addCorsMappings(CorsRegistry registry) {
        registry.addMapping("/**")
                .allowedOriginPatterns("https://smolyanvote.com",  "https://www.smolyanvote.com")
                .allowedMethods("GET", "POST", "PUT", "DELETE", "OPTIONS")
                .allowCredentials(true)
                .maxAge(3600);
    }
    //https://smolyanvote.com
    //http://134.122.75.151:2662
//http://localhost:8080
//http://213.91.128.33:2662

////TODO ВАЖНО !!!
//// Изключване на кеширането на статичните ресурси в тази директория за
//// да може да се актуализират профилните снимки от потребителите.
//// Единствения вариант за сега...
//    @Override
//    public void addResourceHandlers(ResourceHandlerRegistry registry) {
//        registry.addResourceHandler("/images/usersImg/**")
//                .addResourceLocations("file:/D:/MyProjectsJAVA/SmolyanVote/imageStorage/userImages/")
//                .setCachePeriod(0); // Disable caching
//
//        registry.addResourceHandler("/images/eventImg/**")
//                .addResourceLocations("file:/D:/MyProjectsJAVA/SmolyanVote/imageStorage/eventImages/")
//                .setCachePeriod(0); // Disable caching
//
//        registry.addResourceHandler("/images/referendumImages/**")
//                .addResourceLocations("file:/D:/MyProjectsJAVA/SmolyanVote/imageStorage/referendumImages/")
//                .setCachePeriod(0); // Disable caching
//    }
}

