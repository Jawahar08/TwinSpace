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

@Configuration
public class DataSourceConfig {

    private static final Logger log = LoggerFactory.getLogger(DataSourceConfig.class);

    @Bean
    @Primary
    public DataSource dataSource(
            DataSourceProperties properties,
            @Value("${DATABASE_URL:#{null}}") String envDatabaseUrl,
            @Value("${SPRING_PROFILES_ACTIVE:default}") String activeProfile
    ) {
        String url = properties.getUrl();
        String username = properties.getUsername();
        String password = properties.getPassword();
        String driverClassName = null;

        if (envDatabaseUrl != null && !envDatabaseUrl.isBlank()) {
            if ("h2".equalsIgnoreCase(activeProfile) || envDatabaseUrl.contains("localhost:5432")) {
                log.info("Using embedded H2 database (active profile: '{}', DATABASE_URL contains localhost).", activeProfile);
                url = "jdbc:h2:mem:syncnotes;MODE=PostgreSQL;DATABASE_TO_LOWER=TRUE;DEFAULT_NULL_ORDERING=HIGH";
                username = "sa";
                password = "";
                driverClassName = "org.h2.Driver";
            } else {
                url = envDatabaseUrl;
                if (url.startsWith("postgres://")) {
                    url = url.replace("postgres://", "jdbc:postgresql://");
                } else if (url.startsWith("postgresql://")) {
                    url = url.replace("postgresql://", "jdbc:postgresql://");
                }
                driverClassName = "org.postgresql.Driver";
                log.info("Using external PostgreSQL database from DATABASE_URL.");
            }
        } else if (url == null || url.isBlank() || url.contains("h2")) {
            url = "jdbc:h2:mem:syncnotes;MODE=PostgreSQL;DATABASE_TO_LOWER=TRUE;DEFAULT_NULL_ORDERING=HIGH";
            username = "sa";
            password = "";
            driverClassName = "org.h2.Driver";
            log.info("Using default embedded H2 database.");
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
