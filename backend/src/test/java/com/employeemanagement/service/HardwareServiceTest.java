package com.employeemanagement.service;

import com.employeemanagement.dto.HardwareDTO;
import com.employeemanagement.exception.BusinessException;
import com.employeemanagement.exception.ResourceNotFoundException;
import com.employeemanagement.mapper.HardwareMapper;
import com.employeemanagement.model.Hardware;
import com.employeemanagement.repository.HardwareRepository;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.Pageable;

import java.util.List;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class HardwareServiceTest {

    @Mock HardwareRepository repo;
    @Mock HardwareMapper mapper;
    @InjectMocks HardwareService service;

    @Test
    @DisplayName("findAll – liefert paginierte Hardware-Liste")
    void findAll_success() {
        Hardware hw = Hardware.builder().id(1L).name("MacBook").assetTag("HW-001").build();
        HardwareDTO dto = HardwareDTO.builder().id(1L).name("MacBook").assetTag("HW-001").build();
        Page<Hardware> page = new PageImpl<>(List.of(hw));

        when(repo.search(null, null, Pageable.unpaged())).thenReturn(page);
        when(mapper.toDTO(hw)).thenReturn(dto);

        Page<HardwareDTO> result = service.findAll(Pageable.unpaged(), null, null);

        assertThat(result.getContent()).hasSize(1);
        assertThat(result.getContent().getFirst().getName()).isEqualTo("MacBook");
    }

    @Test
    @DisplayName("findById – vorhandene Hardware wird gefunden")
    void findById_success() {
        Hardware hw = Hardware.builder().id(1L).name("MacBook").assetTag("HW-001").build();
        HardwareDTO dto = HardwareDTO.builder().id(1L).name("MacBook").assetTag("HW-001").build();

        when(repo.findById(1L)).thenReturn(Optional.of(hw));
        when(mapper.toDTO(hw)).thenReturn(dto);

        HardwareDTO result = service.findById(1L);

        assertThat(result.getName()).isEqualTo("MacBook");
        verify(repo).findById(1L);
    }

    @Test
    @DisplayName("findById – nicht vorhandene Hardware wirft Exception")
    void findById_notFound() {
        when(repo.findById(99L)).thenReturn(Optional.empty());

        assertThrows(ResourceNotFoundException.class, () -> service.findById(99L));
    }

    @Test
    @DisplayName("create – neue Hardware wird angelegt")
    void create_success() {
        HardwareDTO dto = HardwareDTO.builder().assetTag("HW-NEW").name("Dell Monitor").build();
        Hardware entity = Hardware.builder().id(1L).assetTag("HW-NEW").name("Dell Monitor").build();
        HardwareDTO saved = HardwareDTO.builder().id(1L).assetTag("HW-NEW").name("Dell Monitor").build();

        when(repo.existsByAssetTag("HW-NEW")).thenReturn(false);
        when(mapper.toEntity(dto)).thenReturn(entity);
        when(repo.save(entity)).thenReturn(entity);
        when(mapper.toDTO(entity)).thenReturn(saved);

        HardwareDTO result = service.create(dto);

        assertThat(result.getId()).isEqualTo(1L);
        assertThat(result.getAssetTag()).isEqualTo("HW-NEW");
    }

    @Test
    @DisplayName("create – doppelter Asset-Tag wirft BusinessException")
    void create_duplicateAssetTag() {
        HardwareDTO dto = HardwareDTO.builder().assetTag("HW-001").name("Test").build();
        when(repo.existsByAssetTag("HW-001")).thenReturn(true);

        assertThrows(BusinessException.class, () -> service.create(dto));
        verify(repo, never()).save(any());
    }

    @Test
    @DisplayName("create – doppelte Seriennummer wirft BusinessException")
    void create_duplicateSerial() {
        HardwareDTO dto = HardwareDTO.builder().assetTag("HW-NEW").name("Test").serialNumber("SN-123").build();
        when(repo.existsByAssetTag("HW-NEW")).thenReturn(false);
        when(repo.existsBySerialNumber("SN-123")).thenReturn(true);

        assertThrows(BusinessException.class, () -> service.create(dto));
    }

    @Test
    @DisplayName("delete – ausgeliehene Hardware kann nicht gelöscht werden")
    void delete_loanedThrows() {
        Hardware hw = Hardware.builder().id(1L).name("MacBook").assetTag("HW-001")
                .status(Hardware.HardwareStatus.LOANED).build();
        when(repo.findById(1L)).thenReturn(Optional.of(hw));

        assertThrows(BusinessException.class, () -> service.delete(1L));
        verify(repo, never()).delete(any());
    }

    @Test
    @DisplayName("delete – verfügbare Hardware wird gelöscht")
    void delete_success() {
        Hardware hw = Hardware.builder().id(1L).name("MacBook").assetTag("HW-001")
                .status(Hardware.HardwareStatus.AVAILABLE).build();
        when(repo.findById(1L)).thenReturn(Optional.of(hw));

        service.delete(1L);

        verify(repo).delete(hw);
    }
}
