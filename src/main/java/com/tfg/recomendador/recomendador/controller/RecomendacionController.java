package com.tfg.recomendador.recomendador.controller;

import com.tfg.recomendador.recomendador.model.Pelicula;
import com.tfg.recomendador.recomendador.service.RecomendacionService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/recomendaciones")
public class RecomendacionController {

    @Autowired
    private RecomendacionService recomendacionService;

    @GetMapping("/por-genero")
    public List<Pelicula> recomendarPorGenero(@RequestParam String genero) {
        return recomendacionService.recomendarPorGenero(genero);
    }
}
