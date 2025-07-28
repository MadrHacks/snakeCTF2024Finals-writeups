# Broken ACKademy  [_snakeCTF 2024 Finals_]

**Category**: Network

## Description  

We were sniffing some traffic on an academic network and we found something unusual. \
Could you help us?

## Solution  

The solution can be divided into multiple steps, as outlined below.

### First Step  

The .pcap file must be loaded and inspected to identify relevant packets. Tools such as Wireshark are recommended for initial exploration.  
Using the filter tcp.port == 1337, packets relevant to the challenge can be isolated. The observed communication involves:  

- A server with IP address 192.168.10.10.  
- A client with IP address 192.168.10.57.  

SYN-ACK packets from the server should be examined to extract sequence numbers (seq). Following these, ACK packets from the client should be inspected for anomalies in their acknowledgment numbers.

### Second Step  

The manipulation must be understood by comparing the server’s sequence number and the client’s acknowledgment number. During a standard handshake:  
$$\text{expected\\_ack} = \text{seq} + 1$$

In this challenge, the client deliberately modifies its ACK numbers:
$$\text{diff} = \text{actual\\_ack} - \text{expected\\_ack}$$

Each diff value corresponds to the ASCII value of a character. Only printable characters are valid.

### Third Step  

To automate the extraction process, the following Python script can be used. The script processes the .pcap file, identifies relevant packets, and decodes the hidden flag.  

#### Solver Code  

```python
#!/usr/bin/env python3
import sys
import os
from scapy.utils import rdpcap
from scapy.layers.inet import TCP

def extract_flag(pcap_file):
    packets = rdpcap(pcap_file)
    flag = ""
    seq = None  # To store the server's sequence number

    for pkt in packets:
        # Filter packets between the client and server
        if pkt.haslayer(TCP):
            ip_src = pkt["IP"].src
            ip_dst = pkt["IP"].dst
            tcp_flags = pkt["TCP"].flags

            # Step 1: Capture the sequence number from SYN-ACK
            if ip_src == "192.168.10.10" and tcp_flags == 0x12:  # SYN-ACK
                seq = pkt["TCP"].seq

            # Step 2: Decode the manipulated ACK from the client
            if ip_src == "192.168.10.57" and tcp_flags == 0x10 and seq is not None:
                diff = pkt["TCP"].ack - (seq + 1)
                if diff > 0:  # Ensure valid ASCII character
                    char = chr(diff)
                    if char.isprintable():
                        flag += char
    return flag

if __name__ == "__main__":
    if len(sys.argv) != 2:
        print("Usage: ./solver.py <path_to_pcap>")
        sys.exit(1)

    pcap_path = sys.argv[1]
    if not os.path.exists(pcap_path):
        print("Error: File not found.")
        sys.exit(1)

    flag = extract_flag(pcap_path)
    print(f"Extracted Flag: {flag}")

```

Run the solver script against the .pcap file:

```bash
python solver.py ./path_to_pcap/challenge.pcap
```
