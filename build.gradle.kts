plugins {
	java
	id("org.springframework.boot") version "3.4.4"
	id("io.spring.dependency-management") version "1.0.11.RELEASE"
}

group = "smolyanVote"
version = "0.0.1-SNAPSHOT"

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
	implementation("org.springframework.boot:spring-boot-starter-validation") // включва Jakarta Validation + Hibernate Validator
	implementation("org.springframework.boot:spring-boot-starter-websocket")
	implementation("org.springframework.boot:spring-boot-starter-mail")
	implementation("org.springframework.boot:spring-boot-starter-actuator")
	implementation("org.springframework.boot:spring-boot-devtools")

	// Допълнителни библиотеки
	implementation("org.springframework.security:spring-security-crypto:5.5.2")
	implementation("org.thymeleaf.extras:thymeleaf-extras-springsecurity6")
	implementation("com.mysql:mysql-connector-j:9.2.0")
	implementation("org.modelmapper:modelmapper:2.4.4")
	implementation("org.webjars:sockjs-client:1.1.2")
	implementation("org.webjars:stomp-websocket:2.3.3")
	implementation("com.fasterxml.jackson.core:jackson-databind")
	implementation("org.springframework.boot:spring-boot-configuration-processor")
	implementation("org.projectlombok:lombok")
	annotationProcessor("org.projectlombok:lombok")
	implementation("io.springfox:springfox-boot-starter:3.0.0")
	implementation("org.owasp.encoder:encoder:1.2.3")

	// Тестови зависимости
	testImplementation("org.springframework.boot:spring-boot-starter-test")
	testImplementation("org.springframework.security:spring-security-test")
}


tasks.withType<Test> {
	useJUnitPlatform()
}
