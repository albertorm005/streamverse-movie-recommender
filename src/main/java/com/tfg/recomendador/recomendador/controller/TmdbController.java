package com.tfg.recomendador.recomendador.controller;

import com.tfg.recomendador.recomendador.service.TmdbService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/tmdb")
public class TmdbController {

    @Autowired
    private TmdbService tmdbService;

    @GetMapping("/buscar")
    public String buscarPeliculas(@RequestParam String titulo) {
        return tmdbService.buscarPeliculasPorTitulo(titulo);
    }

    @GetMapping("/pelicula/{id}")
    public String obtenerPelicula(@PathVariable Integer id) {
        return tmdbService.obtenerPeliculaPorId(id);
    }
}