FROM eclipse-temurin:17-jdk-jammy

WORKDIR /app

COPY gradlew .
COPY gradle gradle

COPY build.gradle.kts .
COPY settings.gradle.kts .

RUN ./gradlew build --dry-run

COPY src src

RUN ./gradlew clean build -x test

RUN mkdir -p /app/dist
RUN cp $(find build/libs -name "*.jar" | head -n 1) /app/dist/app.jar
ENTRYPOINT ["java", "-jar", "/app/dist/app.jar"]

EXPOSE 2662
