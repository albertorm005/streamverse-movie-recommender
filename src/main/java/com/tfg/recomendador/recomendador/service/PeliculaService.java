package com.tfg.recomendador.recomendador.service;

import com.tfg.recomendador.recomendador.model.Pelicula;
import com.tfg.recomendador.recomendador.repository.PeliculaRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import java.util.List;

@Service
public class PeliculaService {

    @Autowired
    private PeliculaRepository peliculaRepository;

    public List<Pelicula> obtenerTodas() {
        return peliculaRepository.findAll();
    }

    public Pelicula obtenerPorId(Integer id) {
        return peliculaRepository.findById(id).orElse(null);
    }

    public Pelicula guardarPelicula(Pelicula pelicula) {
        return peliculaRepository.save(pelicula);
    }

    public void eliminarPelicula(Integer id) {
        peliculaRepository.deleteById(id);
    }
}