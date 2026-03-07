cmake_minimum_required(VERSION 3.22)
project(presage_bridge)

find_package(SmartSpectra REQUIRED)
find_package(OpenCV REQUIRED)
find_package(glog REQUIRED)

add_executable(presage_spot presage_spot.cpp)
target_link_libraries(presage_spot SmartSpectra::Container ${OpenCV_LIBS} glog::glog)
