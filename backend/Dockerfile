# --- Build Stage: Use official Maven image with JDK 21 ---
FROM maven:3.9.6-eclipse-temurin-21 AS build

WORKDIR /app

# Copy Maven wrapper (if using it) and project files
COPY pom.xml ./
# COPY .mvn .mvn
# COPY mvnw ./
# RUN chmod +x mvnw

# Copy source code
COPY src ./src

# Build the project (you can use mvn or ./mvnw)
RUN mvn clean package -DskipTests

# --- Runtime Stage: Use lightweight JRE to run the app ---
FROM eclipse-temurin:21-jre

WORKDIR /app

# Copy the built JAR from the previous stage
COPY --from=build /app/target/*.jar app.jar

# Expose the port your app runs on
EXPOSE 8082

# Run the app
ENTRYPOINT ["java", "-jar", "app.jar"]
