package com.tfg.recomendador.recomendador.controller;

import com.tfg.recomendador.recomendador.model.Pelicula;
import com.tfg.recomendador.recomendador.service.PeliculaService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/peliculas")
public class PeliculaController {

    @Autowired
    private PeliculaService peliculaService;

    @GetMapping
    public List<Pelicula> listarPeliculas() {
        return peliculaService.obtenerTodas();
    }

    @GetMapping("/{id}")
    public ResponseEntity<Pelicula> obtenerPelicula(@PathVariable Integer id) {
        Pelicula pelicula = peliculaService.obtenerPorId(id);
        if (pelicula != null) {
            return ResponseEntity.ok(pelicula);
        } else {
            return ResponseEntity.notFound().build();
        }
    }

    @PostMapping
    public Pelicula crearPelicula(@RequestBody Pelicula pelicula) {
        return peliculaService.guardarPelicula(pelicula);
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> eliminarPelicula(@PathVariable Integer id) {
        peliculaService.eliminarPelicula(id);
        return ResponseEntity.noContent().build();
    }
}
