package com.example.CMPE352.service;

import com.example.CMPE352.exception.NotFoundException;
import com.example.CMPE352.model.User;
import com.example.CMPE352.model.WasteGoal;
import com.example.CMPE352.model.WasteLog;
import com.example.CMPE352.model.request.CreateWasteLogRequest;
import com.example.CMPE352.model.request.UpdateWasteLogRequest;
import com.example.CMPE352.model.response.CreateOrEditWasteLogResponse;
import com.example.CMPE352.model.response.DeleteWasteLogResponse;
import com.example.CMPE352.model.response.GetWasteLogResponse;
import com.example.CMPE352.model.response.TotalLogResponse;
import com.example.CMPE352.repository.UserRepository;
import com.example.CMPE352.repository.WasteGoalRepository;
import com.example.CMPE352.repository.WasteLogRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.time.LocalDateTime;
import java.util.Arrays;
import java.util.List;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class WasteLogServiceTest {

    @Mock
    private UserRepository userRepository;

    @Mock
    private WasteLogRepository wasteLogRepository;

    @Mock
    private WasteGoalRepository wasteGoalRepository;

    @InjectMocks
    private WasteLogService wasteLogService;

    private User testUser;
    private WasteGoal testGoal;
    private WasteLog testLog;
    private CreateWasteLogRequest createRequest;
    private UpdateWasteLogRequest updateRequest;

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

        // Setup test log
        testLog = new WasteLog();
        testLog.setLogId(1);
        testLog.setAmount(50.0);
        testLog.setDate(LocalDateTime.now());
        testLog.setUser(testUser);
        testLog.setGoal(testGoal);
        testLog.setWasteType(WasteGoal.wasteType.Plastic);

        // Setup create request
        createRequest = new CreateWasteLogRequest();
        createRequest.setUsername("testUser");
        createRequest.setGoalId(1);
        createRequest.setAmount(50.0);

        // Setup update request
        updateRequest = new UpdateWasteLogRequest();
        updateRequest.setAmount(75.0);
    }

    @Nested
    @DisplayName("getWasteLogsForGoal")
    class GetWasteLogsForGoalTests {

        @Test
        @DisplayName("Should return list of logs when goal exists")
        void getWasteLogsForGoal_WhenGoalExists_ShouldReturnLogs() {
            // Given
            when(wasteGoalRepository.findById(1)).thenReturn(Optional.of(testGoal));
            when(wasteLogRepository.findByGoal(testGoal)).thenReturn(Arrays.asList(testLog));

            // When
            List<GetWasteLogResponse> result = wasteLogService.getWasteLogsForGoal(1);

            // Then
            assertThat(result).hasSize(1);
            GetWasteLogResponse response = result.get(0);
            assertThat(response.getLogId()).isEqualTo(testLog.getLogId());
            assertThat(response.getAmount()).isEqualTo(testLog.getAmount());
            assertThat(response.getGoalId()).isEqualTo(testGoal.getGoalId());
            assertThat(response.getUsername()).isEqualTo(testUser.getUsername());

            verify(wasteGoalRepository).findById(1);
            verify(wasteLogRepository).findByGoal(testGoal);
        }

        @Test
        @DisplayName("Should throw NotFoundException when goal doesn't exist")
        void getWasteLogsForGoal_WhenGoalDoesNotExist_ShouldThrowException() {
            // Given
            when(wasteGoalRepository.findById(999)).thenReturn(Optional.empty());

            // When/Then
            assertThatThrownBy(() -> wasteLogService.getWasteLogsForGoal(999))
                    .isInstanceOf(NotFoundException.class)
                    .hasMessageContaining("WasteGoal not found: 999");

            verify(wasteGoalRepository).findById(999);
            verify(wasteLogRepository, never()).findByGoal(any());
        }
    }

    @Nested
    @DisplayName("createWasteLog")
    class CreateWasteLogTests {

        @Test
        @DisplayName("Should create log when user and goal exist")
        void createWasteLog_WhenUserAndGoalExist_ShouldCreateLog() {
            // Given
            when(userRepository.findByUsername("testUser")).thenReturn(Optional.of(testUser));
            when(wasteGoalRepository.findById(1)).thenReturn(Optional.of(testGoal));

            // Create a log that will be returned by the save operation
            WasteLog savedLog = new WasteLog();
            savedLog.setLogId(1); // Set the ID that would be generated by the database
            savedLog.setAmount(createRequest.getAmount());
            savedLog.setUser(testUser);
            savedLog.setGoal(testGoal);
            savedLog.setWasteType(testGoal.getWasteType());
            savedLog.setDate(LocalDateTime.now()); // Set a date for testing

            // Mock the save operation to return our prepared log
            when(wasteLogRepository.save(any(WasteLog.class))).thenAnswer(invocation -> {
                WasteLog log = invocation.getArgument(0);
                log.setLogId(1); // simulate DB assigning ID
                log.setDate(LocalDateTime.now()); // simulate DB setting date
                return log;
            });

            // When
            CreateOrEditWasteLogResponse response = wasteLogService.createWasteLog(createRequest);


            // Then
            assertThat(response).isNotNull();
            assertThat(response.getLogId()).isEqualTo(1);
            assertThat(response.getAmount()).isEqualTo(createRequest.getAmount());
            assertThat(response.getDate()).isNotNull();

            // Verify the save was called with a log that has the correct values
            verify(wasteLogRepository).save(argThat(log ->
                    log.getAmount().equals(createRequest.getAmount()) &&
                            log.getUser().equals(testUser) &&
                            log.getGoal().equals(testGoal) &&
                            log.getWasteType().equals(testGoal.getWasteType())
            ));

            verify(userRepository).findByUsername("testUser");
            verify(wasteGoalRepository).findById(1);
        }

        @Test
        @DisplayName("Should throw NotFoundException when user doesn't exist")
        void createWasteLog_WhenUserDoesNotExist_ShouldThrowException() {
            // Given
            when(userRepository.findByUsername("nonexistentUser")).thenReturn(Optional.empty());
            createRequest.setUsername("nonexistentUser");

            // When/Then
            assertThatThrownBy(() -> wasteLogService.createWasteLog(createRequest))
                    .isInstanceOf(NotFoundException.class)
                    .hasMessageContaining("User not found: nonexistentUser");

            verify(userRepository).findByUsername("nonexistentUser");
            verify(wasteGoalRepository, never()).findById(any());
            verify(wasteLogRepository, never()).save(any());
        }

        @Test
        @DisplayName("Should throw NotFoundException when goal doesn't exist")
        void createWasteLog_WhenGoalDoesNotExist_ShouldThrowException() {
            // Given
            when(userRepository.findByUsername("testUser")).thenReturn(Optional.of(testUser));
            when(wasteGoalRepository.findById(999)).thenReturn(Optional.empty());
            createRequest.setGoalId(999);

            // When/Then
            assertThatThrownBy(() -> wasteLogService.createWasteLog(createRequest))
                    .isInstanceOf(NotFoundException.class)
                    .hasMessageContaining("WasteGoal not found: 999");

            verify(userRepository).findByUsername("testUser");
            verify(wasteGoalRepository).findById(999);
            verify(wasteLogRepository, never()).save(any());
        }
    }

    @Nested
    @DisplayName("updateWasteLog")
    class UpdateWasteLogTests {

        @Test
        @DisplayName("Should update log when it exists")
        void updateWasteLog_WhenLogExists_ShouldUpdateLog() {
            // Given
            when(wasteLogRepository.findById(1)).thenReturn(Optional.of(testLog));
            when(wasteLogRepository.save(any(WasteLog.class))).thenReturn(testLog);

            // When
            CreateOrEditWasteLogResponse response = wasteLogService.updateWasteLog(1, updateRequest);

            // Then
            assertThat(response.getLogId()).isEqualTo(testLog.getLogId());
            assertThat(response.getAmount()).isEqualTo(updateRequest.getAmount());
            assertThat(response.getDate()).isEqualTo(testLog.getDate());

            verify(wasteLogRepository).findById(1);
            verify(wasteLogRepository).save(any(WasteLog.class));
        }

        @Test
        @DisplayName("Should throw NotFoundException when log doesn't exist")
        void updateWasteLog_WhenLogDoesNotExist_ShouldThrowException() {
            // Given
            when(wasteLogRepository.findById(999)).thenReturn(Optional.empty());

            // When/Then
            assertThatThrownBy(() -> wasteLogService.updateWasteLog(999, updateRequest))
                    .isInstanceOf(NotFoundException.class)
                    .hasMessageContaining("WasteLog not found: 999");

            verify(wasteLogRepository).findById(999);
            verify(wasteLogRepository, never()).save(any());
        }
    }

    @Nested
    @DisplayName("deleteWasteLog")
    class DeleteWasteLogTests {

        @Test
        @DisplayName("Should delete log when it exists")
        void deleteWasteLog_WhenLogExists_ShouldDeleteLog() {
            // Given
            when(wasteLogRepository.findById(1)).thenReturn(Optional.of(testLog));
            doNothing().when(wasteLogRepository).delete(testLog);

            // When
            DeleteWasteLogResponse response = wasteLogService.deleteWasteLog(1);

            // Then
            assertThat(response.getLogId()).isEqualTo(1);

            verify(wasteLogRepository).findById(1);
            verify(wasteLogRepository).delete(testLog);
        }

        @Test
        @DisplayName("Should throw NotFoundException when log doesn't exist")
        void deleteWasteLog_WhenLogDoesNotExist_ShouldThrowException() {
            // Given
            when(wasteLogRepository.findById(999)).thenReturn(Optional.empty());

            // When/Then
            assertThatThrownBy(() -> wasteLogService.deleteWasteLog(999))
                    .isInstanceOf(NotFoundException.class)
                    .hasMessageContaining("WasteLog not found: 999");

            verify(wasteLogRepository).findById(999);
            verify(wasteLogRepository, never()).delete(any());
        }
    }

    @Nested
    @DisplayName("getTotalWasteAmountByTypeAndInterval")
    class GetTotalWasteAmountByTypeAndIntervalTests {

        @Test
        @DisplayName("Should return total amount for given type and interval")
        void getTotalWasteAmountByTypeAndInterval_ShouldReturnTotalAmount() {
            // Given
            LocalDateTime startDate = LocalDateTime.now().minusDays(7);
            LocalDateTime endDate = LocalDateTime.now();
            Double expectedTotal = 150.0;
            when(wasteLogRepository.findTotalAmountByDateRange(WasteGoal.wasteType.Plastic, startDate, endDate))
                    .thenReturn(expectedTotal);

            // When
            TotalLogResponse response = wasteLogService.getTotalWasteAmountByTypeAndInterval(
                    WasteGoal.wasteType.Plastic, startDate, endDate);

            // Then
            assertThat(response.getWasteType()).isEqualTo(WasteGoal.wasteType.Plastic);
            assertThat(response.getTotalAmount()).isEqualTo(expectedTotal);

            verify(wasteLogRepository).findTotalAmountByDateRange(
                    WasteGoal.wasteType.Plastic, startDate, endDate);
        }

        @Test
        @DisplayName("Should return zero when no logs found")
        void getTotalWasteAmountByTypeAndInterval_WhenNoLogsFound_ShouldReturnZero() {
            // Given
            LocalDateTime startDate = LocalDateTime.now().minusDays(7);
            LocalDateTime endDate = LocalDateTime.now();
            when(wasteLogRepository.findTotalAmountByDateRange(WasteGoal.wasteType.Plastic, startDate, endDate))
                    .thenReturn(0.0);

            // When
            TotalLogResponse response = wasteLogService.getTotalWasteAmountByTypeAndInterval(
                    WasteGoal.wasteType.Plastic, startDate, endDate);

            // Then
            assertThat(response.getWasteType()).isEqualTo(WasteGoal.wasteType.Plastic);
            assertThat(response.getTotalAmount()).isZero();

            verify(wasteLogRepository).findTotalAmountByDateRange(
                    WasteGoal.wasteType.Plastic, startDate, endDate);
        }
    }
}