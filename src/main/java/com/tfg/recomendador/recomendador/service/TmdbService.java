package com.tfg.recomendador.recomendador.service;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;
import org.springframework.web.util.UriComponentsBuilder;

@Service
public class TmdbService {

    @Value("${tmdb.api.key}")
    private String apiKey;  // La clave API de TMDB

    private final String apiUrl = "https://api.themoviedb.org/3";

    public String obtenerPeliculaPorId(Integer id) {
        String url = UriComponentsBuilder.fromHttpUrl(apiUrl + "/movie/{id}")
                .queryParam("api_key", apiKey)
                .queryParam("language", "es-ES")
                .toUriString();
        RestTemplate restTemplate = new RestTemplate();
        return restTemplate.getForObject(url, String.class, id);
    }

    public String buscarPeliculasPorTitulo(String titulo) {
        String url = UriComponentsBuilder.fromHttpUrl(apiUrl + "/search/movie")
                .queryParam("api_key", apiKey)
                .queryParam("language", "es-ES")
                .queryParam("query", titulo)
                .toUriString();
        RestTemplate restTemplate = new RestTemplate();
        return restTemplate.getForObject(url, String.class);
    }
}
