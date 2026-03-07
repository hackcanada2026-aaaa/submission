cmake_minimum_required(VERSION 3.27.0)
project(presage_bridge CXX)

set(CMAKE_CXX_STANDARD 17)
set(CMAKE_CXX_STANDARD_REQUIRED ON)

find_package(SmartSpectra REQUIRED)
find_package(OpenCV REQUIRED)

add_executable(presage_spot presage_spot.cpp)
target_link_libraries(presage_spot
    SmartSpectra::Container
    SmartSpectra::Gui
    ${OpenCV_LIBS}
    pthread
)
