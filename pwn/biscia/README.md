# BISCIA [_snakeCTF 2024 Finals_]

**Category**: pwn

## Description

The new Basic Interactive Service to Change Image Attributes (BISCIA) is
now available. Bug free by design and sleek as a sssssnake.

## Solution

Look at the [solver](./attachments/solve.py) to follow along.

### The vulnerability

The challenge is a Python program that lets the user perform some operations on
images by using the `PIL` library. Looking at the challenge's source file, a
function called `win` that prints the flag is available, but it's not called at
runtime. The goal then will be to call such function by overwriting some
addresses.

A good idea is to take a look at the provided Dockerfiles, to check whether a
vulnerable Python version or library has been used. The version of the `PIL`
library used is 10.2.0, and a quick search with the keywords "PIL 10.2.0
vulnerability" is sufficient to find that there is a potential buffer overflow
in the file `_imagingcms.c` [[cve page](https://security.snyk.io/package/pip/pillow/10.2.0)][[vulnerable function](https://github.com/python-pillow/Pillow/blob/6956d0b2853f5c7ec5f6ec4c60725c5a7ee73aeb/src/_imagingcms.c#L194)].

The vulnerable function is defined as follows:

```c
static PyObject *
cms_transform_new(cmsHTRANSFORM transform, char *mode_in, char *mode_out) {
    CmsTransformObject *self;

    self = PyObject_New(CmsTransformObject, &CmsTransform_Type);
    if (!self) {
        return NULL;
    }

    self->transform = transform;

    strcpy(self->mode_in, mode_in);
    strcpy(self->mode_out, mode_out);

    return (PyObject *)self;
}
```

where it's evident that if it is called with the parameters `mode_in` and `mode_out` of arbitrary
length then a buffer overflow could occur. More specifically, `mode_in` and
`mode_out` get saved in a `CmsTransformObject` which is defined as follows:

```c
typedef struct {
    PyObject_HEAD char mode_in[8];
    char mode_out[8];
    cmsHTRANSFORM transform;
} CmsTransformObject;
```

The `cmsHTRANSFORM` struct is provided by the Little-CMS library, and it's
definition can be found
[here](https://github.com/mm2/Little-CMS/blob/master/src/lcms2_internal.h#L1116).

if the `transform` field which is a pointer to a `cmsHTRANSFORM` gets
overwritten, then it's possible to change the program's behaviour. In
particular, by digging through the Little-CMS source code, the `cmsDeleteTransform` (found [here](https://github.com/mm2/Little-CMS/blob/5c54a6dedf6bebefa3a2dbbcf0164bb5616d4ba8/src/cmsxform.c#L147))
which is called on the transform object destruction does use some function pointers that should be defined
inside the `cmsHTRANSFORM` object. In case the first `if` is passed
`cmsPipelineFree` gets called ([source](https://github.com/mm2/Little-CMS/blob/91abcceaffb0d0921f208381ab2b60fee59de79c/src/cmslut.c#L1426))
which eventually uses a function pointer that if overwritten can lead to an
arbitrary code execution.

```c
void CMSEXPORT cmsPipelineFree(cmsPipeline* lut)
{
    cmsStage *mpe, *Next;

    if (lut == NULL) return;

    for (mpe = lut ->Elements;
        mpe != NULL;
        mpe = Next) {

            Next = mpe ->Next;
            cmsStageFree(mpe);
    }

    /* ==========  Interesting line ==========  */
    if (lut ->FreeDataFn) lut ->FreeDataFn(lut ->ContextID, lut ->Data);

    _cmsFree(lut ->ContextID, lut);
}
```

But does the challenge have a code path that leads to `cms_transform_new`? Of
course it does! The function `create_color_transform` calls
`ImageCms.buildTransform`. In `_imagingcms.c`, this maps to `buildTransform`
[(source)](https://github.com/python-pillow/Pillow/blob/6956d0b2853f5c7ec5f6ec4c60725c5a7ee73aeb/src/_imagingcms.c#L444)
which eventually calls `cms_transform_new`. Moreover `create_color_transform` in
the challege gets called with the user's input:

```python
# line 137 of challenge source
choice = int(restricted_input("> "))
output_profile = color_profiles[choice-1]
mode_in = restricted_input("Input mode: ", 9).decode()
mode_out = restricted_input("Output mode: ", 9).decode()

transform = create_color_transform(input_profile, output_profile, mode_in, mode_out)
```

The goal now is to be able to call successfully `cms_transform_new` with an
arbitrary `mode_out` in order to overwrite the `cmsHTRANSFORM transform`
pointer and eventually be able to execute the `win` function from `cmsPipelineFree`.


## Exploitation

First, to get to `cms_transform_new`, a valid output has to be obtained from
`cmsCreateTransform` (because `buildTransform` calls `_buildTransform` which
calls `cmsCreateTransform`) [(source)](https://github.com/python-pillow/Pillow/blob/6956d0b2853f5c7ec5f6ec4c60725c5a7ee73aeb/src/_imagingcms.c#L377).

```c
hTransform = cmsCreateTransform(
    hInputProfile,
    findLCMStype(sInMode),
    hOutputProfile,
    findLCMStype(sOutMode),
    iRenderingIntent,
    cmsFLAGS);
```

The only thing to worry about is `findLCMStype`, because it takes as parameters
the input and output modes that the user can provide as input in the challenge.

```c
static cmsUInt32Number
findLCMStype(char *PILmode) {
    if (strcmp(PILmode, "RGB") == 0) {
        return TYPE_RGBA_8;
    } else if (strcmp(PILmode, "RGBA") == 0) {
        return TYPE_RGBA_8;
    } else if (strcmp(PILmode, "RGBX") == 0) {
        return TYPE_RGBA_8;
    } else if (strcmp(PILmode, "RGBA;16B") == 0) {
        return TYPE_RGBA_16;
    } else if (strcmp(PILmode, "CMYK") == 0) {
        return TYPE_CMYK_8;
    } else if (strcmp(PILmode, "L") == 0) {
        return TYPE_GRAY_8;
    } else if (strcmp(PILmode, "L;16") == 0) {
        return TYPE_GRAY_16;
    } else if (strcmp(PILmode, "L;16B") == 0) {
        return TYPE_GRAY_16_SE;
    } else if (strcmp(PILmode, "YCCA") == 0) {
        return TYPE_YCbCr_8;
    } else if (strcmp(PILmode, "YCC") == 0) {
        return TYPE_YCbCr_8;
    } else if (strcmp(PILmode, "LAB") == 0) {
        // LabX equivalent like ALab, but not reversed -- no #define in lcms2
        return (COLORSPACE_SH(PT_LabV2) | CHANNELS_SH(3) | BYTES_SH(1) | EXTRA_SH(1));
    }

    else {
        /* take a wild guess... but you probably should fail instead. */
        return TYPE_GRAY_8; /* so there's no buffer overrun... */
    }
}
```

The function checks the provided input and output modes against the known ones,
and if nothing is matching then `TYPE_GRAY_8` is returned. This means that if
the goal is to provide an output mode string that is able to overwrite the
`transform` field (see previous section), `TYPE_GRAY_8` will be the return value
of `findLCMStype`. Then, when prompted to choose a color profile in the
challenge `gray-color-profile.icc` should be chosen in order for the input mode
and output mode to work correctly with `TYPE_GRAY_8`. If the return value of
`findLCMStype` is not right for the color profile chosen, an exception gets
generated by the Python interpreter.


### Pointing to an arbitrary address

When asked to provide an input and output mode, only 9 characters can be
provided:

```python
# Line 139 in challenge
mode_in = restricted_input("Input mode: ", 9).decode()
mode_out = restricted_input("Output mode: ", 9).decode()
```

Since the `mode_out` field in a `CmsTransformObject` is 8 chars long, an
overflow of just 1 byte is possible. The `transform` field can then be partially
overwritten with a single byte. Python objects are allocated on the heap, so in
order to make the partial overwrite work first it's needed to perfom some _heap
spraying_ by allocating a lot of stuff on the heap itself. Fortunately this is possible via `store_metadata`, which conveniently also provides the address of
the allocated object via `id`.

A fake object to be used by `cmsDeleteTransform` can then be allocated at an
address $X$, and then the heap can be populated with lots of $X$ to increase the
probability of getting a pointer to $X$ when partially overwriting the
`transform` field in the `CmsTransformObject`.

In case the performed overwrite doesn't make `transform` become pointer to $X$, it is sufficient to restart the challenge and try again.


### The payload

What to allocate on the heap in order to achieve the execution of `win` when `cmsPipelineFree` is executed? A good idea is to first allocate an object with some placeholder values that can give an idea about how pointers are resolved and what is actually available during the execution of `cmsPipelineFree`. For example, if the fake object which is pointed by the overwritten `transform` is like:

```python
fake_obj = b""

fake_obj += b"A"*8 # to exit the for loop in cmsPipelineFree with no error

fake_obj += b"B"*8

# Addr of this gets loaded into RSI
fake_obj += b"C"*8

fake_obj += b"D"*8

fake_obj += b"E"*8
# Addr of function to call at the end of cmsPipelineFree
fake_obj += b"F"*8

fake_obj += b"G"*8

# addr of this gets loaded to rdi
fake_obj += b"H"*8

fake_obj += b"I"*8

fake_obj += b"L"*8
fake_obj += b"M"*8
```

by breaking into `cmsPipelineFree` it's possible to see that `CCCCCCCC` gets loaded into `RSI`, `FFFFFFFF` into `RAX` and `HHHHHHHH` into `RDI`, giving some flexibility in how to hijack the program flow. Disassembling `cmsPipelineFree` shows that before the call to `_cmsFree`, `call rax` is performed, so it's sufficient to load the address of `win` (easy to find with pwntools or gdb) into `RAX` to get it executed.


Having the payload and a way to point at it (heap spraying and partial overwrite), all it's left is trigger the execution of `cmsPipelineFree`, and this can be done simply by choosing the "Exit" option at the challenge prompt.