
plugins {
	id("java")
	id("org.springframework.boot") version "3.4.4"
	id("io.spring.dependency-management") version "1.0.11.RELEASE"
}

group = "smolyanVote"
version = "1"

java {
	sourceCompatibility = JavaVersion.VERSION_17
}

repositories {
	mavenCentral()
}

dependencies {
	// Spring Boot Starters
	implementation("org.springframework.boot:spring-boot-starter-data-jpa")
	implementation("org.springframework.boot:spring-boot-starter-thymeleaf")
	implementation("org.springframework.boot:spring-boot-starter-web")
	implementation("org.springframework.boot:spring-boot-starter-security")
	implementation("org.springframework.boot:spring-boot-starter-validation")
	implementation("org.springframework.boot:spring-boot-starter-websocket")
	implementation("org.springframework.boot:spring-boot-starter-mail")
	implementation("org.springframework.boot:spring-boot-starter-actuator")
	implementation("org.springframework.boot:spring-boot-devtools")
	implementation ("org.springframework.session:spring-session-core")


	// Advanced
	implementation("org.springframework.security:spring-security-crypto:6.4.5")
	implementation("org.thymeleaf.extras:thymeleaf-extras-springsecurity6")
	implementation("com.mysql:mysql-connector-j:9.2.0")
	implementation("org.modelmapper:modelmapper:2.4.4")
	implementation("org.webjars:sockjs-client:1.1.2")
	implementation("org.webjars:stomp-websocket:2.3.3")
	implementation("com.fasterxml.jackson.core:jackson-databind")
	implementation("org.springframework.boot:spring-boot-configuration-processor")
	implementation("org.projectlombok:lombok")
	annotationProcessor("org.projectlombok:lombok")
	implementation("org.owasp.encoder:encoder:1.2.3")
	implementation("org.apache.tika:tika-core:3.1.0")
	implementation("org.springframework.boot:spring-boot-starter-actuator")
	implementation ("org.springframework.retry:spring-retry")
	implementation ("org.springframework:spring-aspects")


	//Cloudinary Images
	implementation("com.cloudinary:cloudinary-http5:2.0.0")
	implementation("com.cloudinary:cloudinary-taglib:2.0.0")
	implementation("io.github.cdimascio:dotenv-java:2.2.4")

	//email
	implementation("com.mailjet:mailjet-client:5.2.6")

	// Springdoc OpenAPI (замяна на Springfox)
	implementation("org.springdoc:springdoc-openapi-starter-webmvc-ui:2.2.0")

	//rate limiting for registration Form
	implementation ("com.github.vladimir-bukhtoyarov:bucket4j-core:8.0.1")



	// Test
	testImplementation("org.springframework.boot:spring-boot-starter-test") {
		exclude(group = "org.junit.vintage", module = "junit-vintage-engine")
	}
	testImplementation("org.springframework.security:spring-security-test")
	testImplementation("io.rest-assured:rest-assured:5.3.0")



}

tasks.withType<Test> {
	useJUnitPlatform()
}

// Фиксиране на SLF4J конфликта
configurations {
	all {
		resolutionStrategy.eachDependency {
			if (requested.group == "org.slf4j") {
				useVersion("2.0.17")
			}
		}
	}
}

tasks.withType<JavaCompile> {
	options.compilerArgs.add("-Xlint:unchecked")
}

