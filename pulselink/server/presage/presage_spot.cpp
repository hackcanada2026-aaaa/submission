#include <smartspectra/container/foreground_container.hpp>
#include <smartspectra/container/settings.hpp>
#include <physiology/modules/messages/metrics.h>
#include <physiology/modules/messages/status.h>
#include <glog/logging.h>
#include <nlohmann/json.hpp>
#include <iostream>
#include <vector>
#include <mutex>

using namespace presage::smartspectra;

int main(int argc, char** argv) {
    google::InitGoogleLogging(argv[0]);
    FLAGS_alsologtostderr = true;
    FLAGS_v = 1;

    if (argc < 3) {
        std::cerr << "Usage: presage_spot <API_KEY> <VIDEO_FILE_PATH>" << std::endl;
        return 1;
    }

    std::string apiKey = argv[1];
    std::string videoPath = argv[2];

    // Use Continuous mode instead of Spot - metrics stream during processing
    container::settings::Settings<
        container::settings::OperationMode::Continuous,
        container::settings::IntegrationMode::Rest
    > settings;

    // Video source configuration
    settings.video_source.input_video_path = videoPath;
    settings.video_source.device_index = -1;  // Disable camera, use file
    settings.video_source.capture_width_px = 1280;
    settings.video_source.capture_height_px = 720;
    settings.video_source.codec = presage::camera::CaptureCodec::MJPG;
    settings.video_source.auto_lock = true;
    settings.video_source.input_video_time_path = "";

    // Processing settings
    settings.headless = true;
    settings.enable_edge_metrics = true;
    settings.verbosity_level = 1;
    settings.continuous.preprocessed_data_buffer_duration_s = 0.5;
    settings.integration.api_key = apiKey;

    nlohmann::json output;
    std::vector<nlohmann::json> readings;
    std::mutex readings_mutex;

    try {
        auto container = std::make_unique<container::CpuContinuousRestForegroundContainer>(settings);

        auto status = container->SetOnCoreMetricsOutput(
            [&readings, &readings_mutex](const presage::physiology::MetricsBuffer& metrics, int64_t timestamp) {
                std::lock_guard<std::mutex> lock(readings_mutex);

                nlohmann::json reading;
                reading["timestamp_ms"] = timestamp;

                if (!metrics.pulse().rate().empty()) {
                    float pulse = metrics.pulse().rate().rbegin()->value();
                    reading["pulse_rate"] = pulse;
                    std::cerr << "[Presage] Heart Rate: " << pulse << " BPM" << std::endl;
                }

                if (!metrics.breathing().rate().empty()) {
                    float breathing = metrics.breathing().rate().rbegin()->value();
                    reading["breathing_rate"] = breathing;
                    std::cerr << "[Presage] Breathing Rate: " << breathing << " BPM" << std::endl;
                }

                if (!metrics.pulse().rate().empty()) {
                    float confidence = metrics.pulse().rate().rbegin()->confidence();
                    reading["pulse_rate_confidence"] = confidence;
                }

                if (!metrics.breathing().rate().empty()) {
                    float confidence = metrics.breathing().rate().rbegin()->confidence();
                    reading["breathing_rate_confidence"] = confidence;
                }

                readings.push_back(reading);
                return absl::OkStatus();
            }
        );

        if (!status.ok()) {
            nlohmann::json err;
            err["error"] = "Failed to set metrics callback";
            err["details"] = std::string(status.message());
            std::cout << err.dump() << std::endl;
            return 1;
        }

        (void)container->SetOnStatusChange(
            [](presage::physiology::StatusValue status) {
                std::cerr << "Status: " << presage::physiology::GetStatusDescription(status.value()) << std::endl;
                return absl::OkStatus();
            }
        );

        auto init_status = container->Initialize();
        if (!init_status.ok()) {
            nlohmann::json err;
            err["error"] = "SmartSpectra initialization failed";
            err["details"] = init_status.ToString();
            std::cout << err.dump() << std::endl;
            return 1;
        }

        auto run_status = container->Run();
        if (!run_status.ok()) {
            nlohmann::json err;
            err["error"] = "SmartSpectra measurement failed";
            err["details"] = run_status.ToString();
            std::cout << err.dump() << std::endl;
            return 1;
        }
    } catch (const std::exception& e) {
        nlohmann::json err;
        err["error"] = "Exception in SmartSpectra";
        err["details"] = e.what();
        std::cout << err.dump() << std::endl;
        return 1;
    }

    // Build summary from all readings
    std::lock_guard<std::mutex> lock(readings_mutex);

    if (readings.empty()) {
        output["error"] = "No metrics received";
        std::cout << output.dump() << std::endl;
        return 0;
    }

    // Include all readings that have values; use confidence only for output metadata
    float pulse_sum = 0, breathing_sum = 0;
    int pulse_count = 0, breathing_count = 0;
    float last_pulse = 0, last_breathing = 0;
    float last_pulse_conf = 0, last_breathing_conf = 0;

    for (const auto& r : readings) {
        if (r.contains("pulse_rate")) {
            pulse_sum += r["pulse_rate"].get<float>();
            pulse_count++;
            last_pulse = r["pulse_rate"].get<float>();
            if (r.contains("pulse_rate_confidence"))
                last_pulse_conf = r["pulse_rate_confidence"].get<float>();
        }
        if (r.contains("breathing_rate")) {
            breathing_sum += r["breathing_rate"].get<float>();
            breathing_count++;
            last_breathing = r["breathing_rate"].get<float>();
            if (r.contains("breathing_rate_confidence"))
                last_breathing_conf = r["breathing_rate_confidence"].get<float>();
        }
    }

    if (pulse_count > 0) {
        output["pulse_rate"] = pulse_sum / pulse_count;
        output["pulse_rate_confidence"] = last_pulse_conf;
    }
    if (breathing_count > 0) {
        output["breathing_rate"] = breathing_sum / breathing_count;
        output["breathing_rate_confidence"] = last_breathing_conf;
    }
    output["readings_count"] = readings.size();
    output["pulse_rate_available"] = (pulse_count > 0);
    output["breathing_rate_available"] = (breathing_count > 0);

    std::cout << output.dump() << std::endl;
    return 0;
}
