FROM ubuntu:22.04

ENV DEBIAN_FRONTEND=noninteractive

# Base build tools
RUN apt-get update && apt-get install -y \
    build-essential git lsb-release curl gpg pkg-config \
    libcurl4-openssl-dev libssl-dev libv4l-dev \
    libgles2-mesa-dev libunwind-dev \
    libgoogle-glog-dev \
    && rm -rf /var/lib/apt/lists/*

# CMake 3.27+ from Kitware
RUN curl -s https://apt.kitware.com/keys/kitware-archive-latest.asc | gpg --dearmor -o /etc/apt/trusted.gpg.d/kitware.gpg \
    && echo "deb https://apt.kitware.com/ubuntu/ $(lsb_release -cs) main" > /etc/apt/sources.list.d/kitware.list \
    && apt-get update && apt-get install -y cmake \
    && rm -rf /var/lib/apt/lists/*

# Presage SmartSpectra SDK (pinned version + physiology edge)
RUN curl -s "https://presage-security.github.io/PPA/KEY.gpg" | gpg --dearmor -o /etc/apt/trusted.gpg.d/presage-technologies.gpg \
    && curl -s --compressed -o /etc/apt/sources.list.d/presage-technologies.list "https://presage-security.github.io/PPA/presage-technologies.list" \
    && apt-get update && apt-get install -y libphysiologyedge-dev libsmartspectra-dev=2.0.4 \
    && rm -rf /var/lib/apt/lists/*

# Copy source and build
WORKDIR /presage
COPY CMakeLists.txt presage_spot.cpp ./
RUN mkdir build && cd build && cmake .. && make

ENTRYPOINT ["/presage/build/presage_spot"]
