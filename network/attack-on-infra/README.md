# attack-on-infra [_snakeCTF 2024 Finals_]

**Category**: network\
**Author**: jotone

## Description

Google™ was about to kill our CTF. Can you find out why?

Note: The flag is in the format `snakeCTF{packetnumber_sha256payload}`.
Where `packetnumber` is the number of the incriminating packet in the pcap file and `sha256payload` is the SHA-256 hash of the payload of the packet.

## Solution

Opening the provided capture file in VirusTotal shows that there is some malicious traffic in the file.
So, by splitting the traffic into different streams, and running them through VirusTotal, it is possible to narrow down the malicious traffic.

Then after running each packet through VirusTotal, it can be seen that the incriminating packet is the number 2148.

Flag: `snakeCTF{2148_154fef579d4bafa6920f0826443cd053780d3828db299b1425ccdc4391229a91}`
