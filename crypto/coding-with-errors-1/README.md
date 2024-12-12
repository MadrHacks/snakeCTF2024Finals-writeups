# Coding with Errors 1 [_snakeCTF 2024 Finals_]

**Category**: crypto

## Description

It is important to know your errors when coding.

## Solution

The challenge presents a server using the [McEliece cipher](https://en.wikipedia.org/wiki/McEliece_cryptosystem) to encrypt a random token that has to be submitted in clear to obtain the flag. 
Among the different options available, the one to exploit is the submission of a ciphertext, which the server will decrypt and check if the
resulting plaintext matches the secret token and how many errors were corrected. Looking at the function `test_ciphertext`

```python
def test_ciphertext():
    ct_hex = input("Ciphertext to test(in hex): ")
    ct = [int(d) for d in bin(int(ct_hex, 16))[2:].zfill(n)]
    
    pt, err_count = cipher.decrypt(ct)
 
    if ''.join([str(d) for d in pt]) == token_bin and err_count == (t-1): 
        print(SUCCESS_LINE)
    else:
        print(FAILURE_LINE)
```

it can be seen that the server returns a success only if the submitted ciphertext decrypts to the secret token and the number of errors it contained was exactly `t-1`, where `t` is the maximum number of errors that the code underlying the cipher can correct. Therefore, the idea is to exploit this function as an oracle to check if a certain position of the encrypted token was modified by the error vector (Sloppy Alice attack). If the nth bit of the encrypted token was flipped and the server returns a success it means that such bit was errored, while if the server returns a failure that bit was not modified by the error vector.

Unfortunately, this cannot be done for the whole ciphertext, since it is 256 bits long, and the server allows only $k+3 = 99$ requests and 3 of them are used to retrieve the encrypted token, the public key and to submit the token. However, to decrypt the token only k positions of the ciphertext needs to be corrected. These positions are those that in the public key correspond to a set of k linearly independent columns, which form an invertible submatrix. One approach that can be used to find these columns is to put the public key in reduced row echelon form and search for the columns corresponding to the first k pivots.

Once an invertible submatrix of the public key has been found and the selected positions of the encrypted token have been corrected, it is possible to decrypt the token by right multiply the encrypted token's subvector, composed by the selected position, with the inverse of the invertible submatrix.

The solver's code can be found [Here](./attachments/solve.py).