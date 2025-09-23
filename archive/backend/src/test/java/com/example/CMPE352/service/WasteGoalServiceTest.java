package com.example.CMPE352.service;

import com.example.CMPE352.exception.NotFoundException;
import com.example.CMPE352.model.User;
import com.example.CMPE352.model.WasteGoal;
import com.example.CMPE352.model.request.CreateWasteGoalRequest;
import com.example.CMPE352.model.response.CreateWasteGoalResponse;
import com.example.CMPE352.model.response.GetWasteGoalResponse;
import com.example.CMPE352.repository.UserRepository;
import com.example.CMPE352.repository.WasteGoalRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.PageRequest;

import java.util.Arrays;
import java.util.List;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatCode;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class WasteGoalServiceTest {

    @Mock
    private WasteGoalRepository wasteGoalRepository;

    @Mock
    private UserRepository userRepository;

    @InjectMocks
    private WasteGoalService wasteGoalService;

    private User testUser;
    private WasteGoal testGoal;
    private CreateWasteGoalRequest createRequest;

    @BeforeEach
    void setUp() {
        // Setup test user
        testUser = new User();
        testUser.setId(1);
        testUser.setUsername("testUser");

        // Setup test goal
        testGoal = new WasteGoal(
                testUser,
                30,
                WasteGoal.wasteUnit.Kilograms,
                WasteGoal.wasteType.Plastic,
                100.0
        );
        testGoal.setGoalId(1);

        // Setup create request
        createRequest = new CreateWasteGoalRequest();
        createRequest.setUsername("testUser");
        createRequest.setDuration(30);
        createRequest.setUnit(WasteGoal.wasteUnit.Kilograms);
        createRequest.setWasteType(WasteGoal.wasteType.Plastic);
        createRequest.setAmount(100.0);
    }

    @Nested
    @DisplayName("getWasteGoals")
    class GetWasteGoalsTests {

        @Test
        @DisplayName("Should return list of goals for user")
        void getWasteGoals_ShouldReturnListOfGoals() {
            // Given
            String username = "testUser";
            int size = 10;
            Long lastGoalId = null;
            List<WasteGoal> goals = Arrays.asList(testGoal);
            Page<WasteGoal> goalPage = new PageImpl<>(goals);

            when(wasteGoalRepository.findTopGoals(username, lastGoalId, PageRequest.of(0, size)))
                    .thenReturn(goalPage);

            // When
            List<GetWasteGoalResponse> result = wasteGoalService.getWasteGoals(username, size, lastGoalId);

            // Then
            assertThat(result).hasSize(1);
            GetWasteGoalResponse response = result.get(0);
            assertThat(response.getGoalId()).isEqualTo(testGoal.getGoalId());
            assertThat(response.getWasteType()).isEqualTo(testGoal.getWasteType().name());
            assertThat(response.getAmount()).isEqualTo(testGoal.getAmount());
            assertThat(response.getDuration()).isEqualTo(testGoal.getDuration());
            assertThat(response.getUnit()).isEqualTo(testGoal.getUnit().name());
            assertThat(response.getProgress()).isEqualTo(testGoal.getPercentOfProgress());
            assertThat(response.getCreatorUsername()).isEqualTo(testUser.getUsername());

            verify(wasteGoalRepository).findTopGoals(username, lastGoalId, PageRequest.of(0, size));
        }

        @Test
        @DisplayName("Should return empty list when no goals found")
        void getWasteGoals_WhenNoGoalsFound_ShouldReturnEmptyList() {
            // Given
            String username = "testUser";
            int size = 10;
            Long lastGoalId = null;
            Page<WasteGoal> emptyPage = new PageImpl<>(List.of());

            when(wasteGoalRepository.findTopGoals(username, lastGoalId, PageRequest.of(0, size)))
                    .thenReturn(emptyPage);

            // When
            List<GetWasteGoalResponse> result = wasteGoalService.getWasteGoals(username, size, lastGoalId);

            // Then
            assertThat(result).isEmpty();
            verify(wasteGoalRepository).findTopGoals(username, lastGoalId, PageRequest.of(0, size));
        }
    }

    @Nested
    @DisplayName("saveWasteGoal")
    class SaveWasteGoalTests {

        @Test
        @DisplayName("Should create goal when user exists")
        void saveWasteGoal_WhenUserExists_ShouldCreateGoal() {
            // Given
            when(userRepository.findByUsername("testUser")).thenReturn(Optional.of(testUser));
            when(wasteGoalRepository.save(any(WasteGoal.class))).thenReturn(testGoal);

            // When
            CreateWasteGoalResponse response = wasteGoalService.saveWasteGoal(createRequest);

            // Then
            assertThat(response.getUsername()).isEqualTo("testUser");
            assertThat(response.getGoalId()).isEqualTo(testGoal.getGoalId());

            verify(userRepository).findByUsername("testUser");
            verify(wasteGoalRepository).save(any(WasteGoal.class));
        }

        @Test
        @DisplayName("Should throw NotFoundException when user doesn't exist")
        void saveWasteGoal_WhenUserDoesNotExist_ShouldThrowException() {
            // Given
            when(userRepository.findByUsername("nonexistentUser")).thenReturn(Optional.empty());
            createRequest.setUsername("nonexistentUser");

            // When/Then
            assertThatThrownBy(() -> wasteGoalService.saveWasteGoal(createRequest))
                    .isInstanceOf(NotFoundException.class)
                    .hasMessageContaining("User not found: nonexistentUser");

            verify(userRepository).findByUsername("nonexistentUser");
            verify(wasteGoalRepository, never()).save(any());
        }
    }

    @Nested
    @DisplayName("editWasteGoal")
    class EditWasteGoalTests {

        @Test
        @DisplayName("Should update goal when it exists")
        void editWasteGoal_WhenGoalExists_ShouldUpdateGoal() {
            // Given
            when(wasteGoalRepository.findById(1)).thenReturn(Optional.of(testGoal));
            when(wasteGoalRepository.saveAndFlush(any(WasteGoal.class))).thenReturn(testGoal);

            WasteGoal updatedGoal = new WasteGoal();
            updatedGoal.setDuration(60);
            updatedGoal.setUnit(WasteGoal.wasteUnit.Kilograms);
            updatedGoal.setWasteType(WasteGoal.wasteType.Paper);
            updatedGoal.setAmount(200.0);

            // When
            CreateWasteGoalResponse response = wasteGoalService.editWasteGoal(1, updatedGoal);

            // Then
            assertThat(response.getUsername()).isEqualTo("testUser");
            assertThat(response.getGoalId()).isEqualTo(testGoal.getGoalId());

            verify(wasteGoalRepository).findById(1);
            verify(wasteGoalRepository).saveAndFlush(any(WasteGoal.class));
        }

        @Test
        @DisplayName("Should throw NotFoundException when goal doesn't exist")
        void editWasteGoal_WhenGoalDoesNotExist_ShouldThrowException() {
            // Given
            when(wasteGoalRepository.findById(999)).thenReturn(Optional.empty());

            // When/Then
            assertThatThrownBy(() -> wasteGoalService.editWasteGoal(999, new WasteGoal()))
                    .isInstanceOf(NotFoundException.class)
                    .hasMessageContaining("Goal not found: 999");

            verify(wasteGoalRepository).findById(999);
            verify(wasteGoalRepository, never()).saveAndFlush(any());
        }
    }

    @Nested
    @DisplayName("deleteWasteGoal")
    class DeleteWasteGoalTests {

        @Test
        @DisplayName("Should delete goal when it exists")
        void deleteWasteGoal_WhenGoalExists_ShouldDeleteGoal() {
            // Given
            when(wasteGoalRepository.findById(1)).thenReturn(Optional.of(testGoal));
            doNothing().when(wasteGoalRepository).delete(testGoal);

            // When/Then
            assertThatCode(() -> wasteGoalService.deleteWasteGoal(1))
                    .doesNotThrowAnyException();

            verify(wasteGoalRepository).findById(1);
            verify(wasteGoalRepository).delete(testGoal);
        }

        @Test
        @DisplayName("Should throw NotFoundException when goal doesn't exist")
        void deleteWasteGoal_WhenGoalDoesNotExist_ShouldThrowException() {
            // Given
            when(wasteGoalRepository.findById(999)).thenReturn(Optional.empty());

            // When/Then
            assertThatThrownBy(() -> wasteGoalService.deleteWasteGoal(999))
                    .isInstanceOf(NotFoundException.class)
                    .hasMessageContaining("Goal not found: 999");

            verify(wasteGoalRepository).findById(999);
            verify(wasteGoalRepository, never()).delete(any());
        }
    }
}