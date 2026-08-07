package com.syncnotes.config;

import com.zaxxer.hikari.HikariDataSource;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.autoconfigure.jdbc.DataSourceProperties;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.context.annotation.Primary;

import javax.sql.DataSource;
import java.net.URI;

@Configuration
public class DataSourceConfig {

    private static final Logger log = LoggerFactory.getLogger(DataSourceConfig.class);

    @Bean
    @Primary
    public DataSource dataSource(
            DataSourceProperties properties,
            @Value("${DATABASE_URL:#{null}}") String envDatabaseUrl,
            @Value("${SPRING_PROFILES_ACTIVE:default}") String activeProfile,
            @Value("${USE_H2:false}") boolean useH2
    ) {
        String url = properties.getUrl();
        String username = properties.getUsername();
        String password = properties.getPassword();
        String driverClassName = null;

        boolean forceH2 = useH2 || "h2".equalsIgnoreCase(activeProfile);

        if (forceH2 || envDatabaseUrl == null || envDatabaseUrl.isBlank() || envDatabaseUrl.contains("localhost:5432")) {
            log.info("Using embedded H2 database (active profile: '{}', forceH2: {}).", activeProfile, forceH2);
            url = "jdbc:h2:mem:syncnotes;MODE=PostgreSQL;DATABASE_TO_LOWER=TRUE;DEFAULT_NULL_ORDERING=HIGH";
            username = "sa";
            password = "";
            driverClassName = "org.h2.Driver";
        } else if (envDatabaseUrl.startsWith("postgres://") || envDatabaseUrl.startsWith("postgresql://") || envDatabaseUrl.startsWith("jdbc:postgresql://")) {
            driverClassName = "org.postgresql.Driver";
            String cleanUrl = envDatabaseUrl;
            if (cleanUrl.startsWith("jdbc:")) {
                cleanUrl = cleanUrl.substring(5);
            }
            try {
                URI uri = new URI(cleanUrl);
                if (uri.getUserInfo() != null && uri.getUserInfo().contains(":")) {
                    String[] userInfo = uri.getUserInfo().split(":", 2);
                    username = userInfo[0];
                    password = userInfo[1];
                    log.info("Extracted database credentials for user '{}' from DATABASE_URL.", username);
                }
                String host = uri.getHost();
                int port = uri.getPort() > 0 ? uri.getPort() : 5432;
                String path = uri.getPath();
                url = "jdbc:postgresql://" + host + ":" + port + path;
            } catch (Exception e) {
                log.warn("Could not parse DATABASE_URL as URI, using raw URL: {}", e.getMessage());
                url = envDatabaseUrl.startsWith("jdbc:") ? envDatabaseUrl : "jdbc:" + envDatabaseUrl;
            }
            log.info("Using external PostgreSQL database from DATABASE_URL target: {}", url);
        }

        HikariDataSource dataSource = new HikariDataSource();
        dataSource.setJdbcUrl(url);
        if (driverClassName != null) {
            dataSource.setDriverClassName(driverClassName);
        }
        if (username != null && !username.isBlank()) {
            dataSource.setUsername(username);
        }
        if (password != null) {
            dataSource.setPassword(password);
        }

        return dataSource;
    }
}
