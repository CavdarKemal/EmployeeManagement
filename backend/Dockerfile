# ── Stage 1: Build ──────────────────────────────────────────────────────────
FROM maven:3.9-eclipse-temurin-21 AS build

WORKDIR /app

# Abhängigkeiten cachen (nur pom.xml zuerst kopieren)
COPY pom.xml .
RUN mvn dependency:go-offline -B

# Quellcode kopieren und bauen (Tests überspringen – laufen separat)
COPY src ./src
RUN mvn package -DskipTests -B

# ── Stage 2: Test ───────────────────────────────────────────────────────────
FROM build AS test
# Tests laufen hier gegen externe DB (docker-compose.test.yml)
CMD ["mvn", "test", "-B"]

# ── Stage 3: Development ────────────────────────────────────────────────────
FROM eclipse-temurin:25-jre AS development
WORKDIR /app
COPY --from=build /app/target/employeemanagement-backend-1.0.0.jar app.jar

# Spring DevTools für Hot-Reload
ENV JAVA_OPTS="-Xms128m -Xmx256m -agentlib:jdwp=transport=dt_socket,server=y,suspend=n,address=*:5005"
EXPOSE 8080 5005
ENTRYPOINT ["sh", "-c", "java $JAVA_OPTS -jar app.jar"]

# ── Stage 4: Production ─────────────────────────────────────────────────────
FROM eclipse-temurin:25-jre-alpine AS production

# Sicherheit: kein Root
RUN addgroup -S employeemanagement && adduser -S employeemanagement -G employeemanagement
WORKDIR /app

# Nur das fertige JAR kopieren
COPY --from=build /app/target/employeemanagement-backend-1.0.0.jar app.jar
RUN chown employeemanagement:employeemanagement app.jar

# Upload-Verzeichnis anlegen
RUN mkdir -p /app/uploads && chown employeemanagement:employeemanagement /app/uploads
VOLUME ["/app/uploads"]

USER employeemanagement
EXPOSE 8080

# Health-Check via Spring Actuator
HEALTHCHECK --interval=15s --timeout=5s --start-period=60s --retries=3 \
  CMD wget -qO- http://localhost:8080/actuator/health || exit 1

ENV JAVA_OPTS="-Xms256m -Xmx512m -XX:+UseContainerSupport -XX:MaxRAMPercentage=75"
ENTRYPOINT ["sh", "-c", "java $JAVA_OPTS -jar app.jar"]
