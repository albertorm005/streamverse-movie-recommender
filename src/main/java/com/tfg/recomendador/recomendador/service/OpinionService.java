package com.tfg.recomendador.recomendador.service;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import com.tfg.recomendador.recomendador.repository.OpinionRepository;
import com.tfg.recomendador.recomendador.model.Opinion;
import java.util.Optional;

@Service
public class OpinionService {

    @Autowired
    private OpinionRepository opinionRepository;

    public boolean eliminarOpinion(String opinionId, String usuarioActual) {
        Optional<Opinion> opinionOpt = opinionRepository.findById(opinionId);

        if (opinionOpt.isPresent()) {
            Opinion opinion = opinionOpt.get();

            // Verificar que el usuario actual es el autor de la opinión
            if (opinion.getUsuario().equals(usuarioActual)) {
                opinionRepository.delete(opinion);
                return true;
            }
        }

        return false;
    }
}