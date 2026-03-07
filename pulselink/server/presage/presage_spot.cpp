#include <smartspectra/container/foreground_container.hpp>
#include <smartspectra/container/settings.hpp>
#include <physiology/modules/messages/metrics.h>
#include <glog/logging.h>
#include <nlohmann/json.hpp>
#include <iostream>
#include <fstream>

using namespace presage::smartspectra;

int main(int argc, char** argv) {
    google::InitGoogleLogging(argv[0]);
    FLAGS_alsologtostderr = false;

    if (argc < 3) {
        std::cerr << "Usage: presage_spot <API_KEY> <VIDEO_FILE_PATH>" << std::endl;
        return 1;
    }

    std::string apiKey = argv[1];
    std::string videoPath = argv[2];

    container::settings::Settings<
        container::settings::OperationMode::Spot,
        container::settings::IntegrationMode::Rest
    > settings;

    settings.video_source.video_file = videoPath;
    settings.integration.api_key = apiKey;
    settings.headless = true;
    settings.spot.spot_duration_s = 10;

    nlohmann::json output;

    try {
        container::ForegroundContainer<
            container::settings::OperationMode::Spot,
            container::settings::IntegrationMode::Rest
        > container(settings);

        container.OnMetricsOutput = [&output](const nlohmann::json& metrics) {
            output = metrics;
            return absl::OkStatus();
        };

        auto status = container.Run();
        if (!status.ok()) {
            nlohmann::json err;
            err["error"] = "SmartSpectra measurement failed";
            err["details"] = status.ToString();
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

    std::cout << output.dump() << std::endl;
    return 0;
}
