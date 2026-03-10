package com.tfg.recomendador.recomendador.service;

import com.tfg.recomendador.recomendador.model.Pelicula;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import java.util.List;
import java.util.stream.Collectors;

@Service
public class RecomendacionService {

    @Autowired
    private PeliculaService peliculaService;

    public List<Pelicula> recomendarPorGenero(String genero) {
        // Como la clase Pelicula no tiene atributo de géneros, solo ordenamos por puntuación
        return peliculaService.obtenerTodas().stream()
                .sorted((p1, p2) -> Double.compare(p2.getVoteAverage(), p1.getVoteAverage()))
                .collect(Collectors.toList());
    }
}