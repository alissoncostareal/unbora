# Stage 1: Build
FROM maven:3.9.9-eclipse-temurin-21-alpine AS builder
WORKDIR /build

COPY pom.xml ./
COPY src ./src
RUN mvn clean package -DskipTests

# Stage 2: Runtime Image
FROM eclipse-temurin:21-jre-alpine AS runner
WORKDIR /app

RUN addgroup -S unbora && adduser -S unbora -G unbora
COPY --from=builder /build/target/unbora-api-1.0.0.jar app.jar
RUN chown -R unbora:unbora /app

USER unbora

EXPOSE 3001

ENV JAVA_OPTS="-XX:+UseContainerSupport -XX:MaxRAMPercentage=75.0 -Dfile.encoding=UTF-8"

ENTRYPOINT ["sh", "-c", "java $JAVA_OPTS -jar app.jar"]
