# AISSH - Avoid Intrusion into Super Secret Home

AISSH is the demonstration of an alternative approach to security.

Data has value, and so we protect it behind authentication barriers like a linux login. This slows down the potential attacker, but the data has value, so it's worth the effort to try and brute-force the credentials.

However, what if we instead rendered the data value-less?

With AISSH, this is accomplished by emulating a consistent filesystem for every username/password pair. Only one of which, of course, is the real file-system.

By leveraging an embedded browser LLM, AISSH emulates a realistic file-system purely based on the username/password hash. Repeated logins with the same credentials will yield the same filesystem.

An attacker can therefore no longer discern what is real and what is not real. This renders the data value-less.

No more hacking, happy world.

## Live Demo

*High-spec or GPU based machine advisable for better experience*

*The first time AISSH is run, AISSH will embed a Llama-3.1-8B model in the browser. This is a substantial download so will take a while*

Subsequent runs will use the cached LLM and so load much faster (~10-15 seconds).

http://decentapps.net/aissh

## Hello/World

<img width="1052" height="1065" alt="image" src="https://github.com/user-attachments/assets/cdeb27ef-9b17-4e7d-bb2e-8549832f3717" />

## Features

- `ls` and `cd` commands for filesystem navigation using relative and absolute paths. Bash completion even works!

<img width="1935" height="1040" alt="image" src="https://github.com/user-attachments/assets/d08dae95-754d-4535-9910-4d044937c6bd" />

- `cat` command is overloaded, and will generate realistic file contents for any filename and extension

<img width="1326" height="1089" alt="image" src="https://github.com/user-attachments/assets/64937c47-38c9-4503-b725-f8b556eca42b" />

- `cat` is overloaded too so here's the contents of an image file

<img width="1357" height="1108" alt="image" src="https://github.com/user-attachments/assets/c72b3179-5251-47a5-8127-cf7631d2d5c9" />

- say `hello` to the person you hacked

<img width="1167" height="485" alt="image" src="https://github.com/user-attachments/assets/50104bed-59b2-411c-919f-4307d68105bc" />

## Commands

Typing `help` into the AISSH console, will give you the implemented commands. I have implemented some of the core bash functionality, as well as some helper commands to understand what's going on under the hood:

1. `ls` and `cd` have basic functionality implemented including bash completion, absolute and relative paths. This can be used to navigate the filesystem
2. `cat` is overloaded so you can cat any file. Depending on the file-type and file-name, the contents will vary
  - `cat` a picture file to also get an LLM-generated picture of the picture description in the file content
  - `cat` a music file to get the description of a song that can be used to generate a real music file using various online music generators. I have not found a free service yet, so not generating the music automatically

### Under the hood

1. The loading screen is a bit of fun that emulates a linux server boot-up. In reality, it's a loading screen for the embedded LLM which runs in the background. The LLM is running cold (temp=0) to ensure deterministic behaviour across logins with same username/password combination
1. `fstab` shows you the current filesystem as a filetree. Notice that the folders are empty to start with
1. `id` shows the persona generated for the login
1. `ls` an empty folder, to call the LLM to generate a file-list. The persona is taken into account when generating the file-list
1. `cat` will also take the persona into account when generating file content via the LLM. It also handles image files and generates an inline picture for the given content

## The magic

1. When logging in, the username/password pair generates a hash
1. This hash is then used generate a persona with:
  - 3-5 traits from a list of 30
  - 1-2 favourite foods from a list of 20
  - 1 favourite colour from a list of 10
  - 1 job from a list of 30
  - 1 favourite animal from a list of 30
  - their age between 18 and 90
  - 1 adjective describing childhood from a list of 10
1. The generated persona can be seen with the `id` command
1. This persona is then used when creating the file-list in a given folder (filenames) when using `ls`, as well as the contents of file when using `cat`

The combination of the LLM running at temp=0, and the deterministic nature of the persona creation ensures a repeatable experience for each username/password combination

Identifying whether the data is a real filesystem is made harder as the persona-approach ensures there is a common theme across filenames and file content

## Contact

Linkedin: https://www.linkedin.com/in/peterturnerlondon/

## Acknowledgements

### Decent Framework
The Decent Framework facilitates embedding an LLM into your local dev environment, for local inference development.

This opens up AI development to all (for free)!

https://github.com/erikh2000/create-decent-app

## Licensing

MIT
