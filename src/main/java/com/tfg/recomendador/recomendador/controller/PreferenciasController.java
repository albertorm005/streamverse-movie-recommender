package com.tfg.recomendador.recomendador.controller;

import com.tfg.recomendador.recomendador.dto.PreferenciasDTO;
import com.tfg.recomendador.recomendador.service.PreferenciasService;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Controller;
import org.springframework.web.bind.annotation.*;

@Controller
@RequestMapping("/api/preferencias")
public class PreferenciasController {

    private final PreferenciasService preferenciasService;

    public PreferenciasController(PreferenciasService preferenciasService) {
        this.preferenciasService = preferenciasService;
    }

    @PostMapping("/guardar")
    @ResponseBody
    public ResponseEntity<String> guardarPreferencias(@RequestBody PreferenciasDTO preferenciasDTO) {
        preferenciasService.guardarPreferencias(preferenciasDTO);
        return ResponseEntity.ok("Preferencias guardadas correctamente");
    }
}