import pyshark
import struct

from pathlib import Path
from PIL import Image
from typing import Optional


def parse_framebuffer_update(
        buffer: bytes | bytearray, 
        width: int, 
        height: int
    ) -> Image:
    """Parse the framebuffer update and return an image"""
    # create a new image
    image = Image.frombytes(
        "RGBA",
        (width, height),
        buffer,
        "raw",
    )

    return image
    

def parse_buffer(
    buffer: bytes | bytearray, 
    bits_per_pixel: int
    ) -> Optional[list[Image]]:
    """Try to parse the buffer for framebuffer updates and return a list of images"""
    images = []

    while len(buffer) > 0:
        # check if the buffer starts with the framebuffer update message header
        if not buffer.startswith(bytes.fromhex("00000001")):
            # if not remove the first byte and try again
            buffer.pop(0)
            continue

        # extract the data
        width, height = struct.unpack(">HH", buffer[8:12])

        data_len = width*height*(bits_per_pixel//8)
        data = buffer[4:data_len+4]

        # remove the data from the buffer
        buffer = buffer[data_len+4:]

        # parse the data
        if len(data) == data_len:
            image = parse_framebuffer_update(data, width, height)
            images.append(image)

    return images


def main(pcap_file: Path):
    # check if the file exists
    if not pcap_file.exists() and not pcap_file.is_file():
        print(f"File {pcap_file} does not exist")
        exit(1)
    
    # open the pcap file
    pcap = pyshark.FileCapture(
        str(pcap_file),
        display_filter="tcp.port == 5900",
    )

    # buffer to store the framebuffer data
    buffer = bytearray()
    # structure to store the pixel format
    bits_per_pixel = 0
    
    for packet in pcap:
        # from the client we only need the SetPixelFormat
        if packet.tcp.dstport == "5900":
            # filter out non VNC packets
            if packet.highest_layer != "VNC":
                continue
            vnc = packet.vnc

            if "client_message_type" not in vnc.field_names:
                continue

            if vnc.client_message_type == "0":
                print("SetPixelFormat message found")
                bits_per_pixel = int(vnc.client_bits_per_pixel)

        # from the server we need the framebuffer updates
        elif packet.tcp.srcport == "5900":
            tcp = packet.tcp

            # filter out packets without data
            if tcp.len == "0":
                continue

            buffer.extend(bytes.fromhex(tcp.payload.replace(":", "")))

    # parse the bufferq
    images = parse_buffer(buffer, bits_per_pixel)
    print(f"Found {len(images)} images")
    for i, image in enumerate(images):
        image.save(f"image_{i}.png")


if __name__ == "__main__":
    import argparse

    parser = argparse.ArgumentParser(description='Parse pcap file')
    parser.add_argument('--pcap_file', type=Path, help='pcap file to parse', default="capture.pcapng")
    args = parser.parse_args()

    main(args.pcap_file)
