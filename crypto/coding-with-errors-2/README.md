# Coding with Errors 2 [_snakeCTF 2024 Finals_]

**Category**: crypto

## Description

Maybe we should be more strict about errors in codes.

## Solution

The setting for this challenge is almost the same of `Coding with Errors 1`, but this time the condition for the test of a ciphertext to be successful is more stricter, as it can be seen by looking at the function `test_ciphertext`

```python
def test_ciphertext():
    ct_hex = input("Ciphertext to test(in hex): ")
    ct = [int(d) for d in bin(int(ct_hex, 16))[2:].zfill(n)]
    
    pt, err_count = cipher.decrypt(ct)

    if ''.join([str(d) for d in pt]) == token_bin and err_count == t: 
        print(SUCCESS_LINE)
    else:
        print(FAILURE_LINE)
```
This time the number of errors corrected by the server must be exactely `t`, otherwise the server will return the failure message. This means that it is not possible to flip one bit of the encrypted token and submit it to check if that position was errored or not, as flipping just one bit will change the number of errors to either `t-1` or `t+1`.

Therefore, to carry out the Sloppy Alice attack for this setting, the idea is to flip 2 bit at a time. By doing so, 2 things can happen:
 1. If the flipped bits were both errored or both correct than the error count becomes `t-2` or `t+2` respectively, and the server will return the failure message. 
 2. If only one of the flipped bit was errored, than the error count remains `t` and the server returns the success message.

Using the results of these requests it is possible to build a $k\times(n+1)$ matrix representing a system of linear equations in GF(2), whose solution is the error vector, restricted to the positions that correspond to the columns that form an invertible submatrix of the public key. For couples that fall into the first category, the last column value is set to 0, since they have the same value in the error vector (either both 1 or 0), while for the couples that fall in the second category the last column value is set to 1, as only one of them has value 1 in the error vector. If this reasoning were applied to all the rows of the system, this would end up being indeterminate with 2 possible solutions. One way to avoid this is to set 3 1s among the firs n entries of the last row and set the last entry to either 1 or 0. If the solution of the system has $\le20$ 1s, than it is the correct error vector, otherwise 1s and 0s have to be flipped. Once the error vector has been recovered, it is possible to decrypt the token in the same way as it was done for `Coding with Errors 1`.

The solver's code can be found [Here](./attachments/solve.py).