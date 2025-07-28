# bABE [_snakeCTF 2024 Finals_]

**Category**: Crypto

## Description

If I'm an hacker, do I also have to be a snake to be a MadrHack?

## Solution

The challenge implements a pairing-free CP-ABE scheme, following the one presented in [paper 1](#references), and this means that the type of Attribute-Based Encryption uses a Ciphertext policy, where the secret keys are generated over a subset of the attributes of the schema, while data encryption is done using an access tree (_i.e._ a logical combination of attributes).  
The important information here is that the scheme is also pairing-free and as presented by _J. Herranz_ in one of his publications (see [paper 2](#references)), every scheme that has been implemented without pairing-free elliptic curves is vulnerable to a certain degree.

In our challenge scenario the scheme works with RSA, in fact are used two primes $p$ and $q$ to generate the RSA modulus $N$ and the totient $\phi(N)$, plus for each attribute of the schema is generated a tuple $(p_i, q_i)$ s.t.
$$gcd(p_i, \phi(N)) = 1$$
$$p_i \cdot q_i = 1 \quad (\text{mod }\phi(N))$$

Then is choosen a generator $g$ (coprime with $N$) and are calculated the public parameters:
 - $D_u = g^{d_u}$
 - $Y = g^{x}$
 - $R = g^{k}$

where

 - $(x,k)$ is the private key pair, which are two random numbers coprime with $\phi(N)$
 - $d_u = \prod q_i$

During the **encryption** is calculated a key $K_m = (D_u^{r_m})^\alpha$ which is used to encrypt the given plaintext (combination of hashing and xoring), thus being able to retrieve or compute $K_m$ means that we're able to decrypt the ciphertext.  
Here $\alpha$ is the product of the $p_i$ of the attributes that are not in the encryption policy.

In fact in the **decryption** function, is used the secret key pair $(k_1, k_2)$ (generated from a subset of attributes) to compute $K_m$, by exponentating $Ym$ and $Rm$ respectively to $k_1$ and $k_2$.
The decryption works because $Ym$ and $Rm$ are public parameters (included in the ciphertext) and the pair $(k_1, k_2)$ let us re-compute the correct $K_m$ iff are generated from the same set of attributes used to encrypt the plaintext.

The last statements should be always true, but this challenge highlights how is not always the case and why is vulnerable.

In fact, if a plaintext has been encrypted over a set of attributes $\mathbb{A}$, for which we can't generate the key pair, but $\mathbb{A} = a_1 \land a_2 \land \ldots \land a_n$ and we're able to generate multiple key pairs such that they cover all attributes in $\mathbb{A}$, then we can compute the correct $K_m$ for $\mathbb{A}$ and decrypt the ciphertext.

### Attack

In our challenge $\mathbb{A} = \{\text{SNAKE}, \text{HACKER}\}$ and the attacker could generate the key pair for a single attribute a time, while the ciphertext was encrypted using both attributes togheter.

However the attacker can get the key pairs for the single attributes ($(k_{11}, k_{12})$ and $(k_{21}, k_{22})$) recover $K_m$.

We recall that in the decryption function $K_m$ is computed as follows:
$$K_m = (Ym^{k_2} \cdot Rm^{k_1})^\alpha = (g^{r_m \cdot q_1 q_2})^\alpha$$

where $\alpha$ is the product of the $p_i$ of the attributes that are **not** in the ciphertext policy.
In the challenge it was the case that $\alpha = 1$, because all two attributes where used to encrypt the flag, so $K_m = g^{r_m \cdot q_1 q_2}$.

Because of how the secret pair $(x,k)$ is created, we have that
$$k \cdot k_1 + x \cdot k_2 = \prod_{a_i \in \mathbb{A}} q_i = q_1 q_2 \quad (\text{mod }\phi(N))$$

and

$$k \cdot k_{11} + x \cdot k_{12} = q_1 \quad (\text{mod }\phi(N))$$
$$k \cdot k_{21} + x \cdot k_{22} = q_2 \quad (\text{mod }\phi(N))$$

thus we can compute
$$Ym^{k_{12}} \cdot Rm^{k_{11}} = g^{r_m q_1}$$
$$Ym^{k_{22}} \cdot Rm^{k_{21}} = g^{r_m q_2}$$

Now because we know both primes $p_1$ and $p_2$ and we know that are coprime, we can compute two values $a_1, a_2$ such that $a_1 p_1 + a_2 p_2 = 1$ with the extended Euclidean algorithm and finally we can raise the results previously computed to these two values to retrieve $K_m$:

$${g^{r_m q_1}}^{a_2} \cdot {g^{r_m q_2}}^{a_1} = g^{r_m \cdot q_1 q_2} = K_m \quad (\text{mod }(N))$$

Having found the key of the ciphertext we're not able to decrypt the message.

### Flag

`snakeCTF{p4iring_fr33_4B3_1s_br0k3n}`

## References

1) [Expressive CP-ABE Scheme Satisfying Constant-Size Keys and Ciphertexts (2019)](https://eprint.iacr.org/2019/1257)
2) [Attacking Pairing-Free Attribute-Based Encryption Schemes - J. Herranz (2020)](https://ieeexplore.ieee.org/document/9291064)

The `.pdf` of the papers listed above can be found here [PDFs](https://github.com/MadrHacks/snakeCTF2024Finals-writeups/tree/main/crypto/bABE/references).
