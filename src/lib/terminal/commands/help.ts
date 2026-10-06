import { Command, CommandResult } from "../types";

/**
 * help - Display available commands
 */
export const helpCommand: Command = {
  name: "help",
  description: "Display available commands",
  usage: "help",
  execute: (): CommandResult => {
    const helpText = `
CyberCodex Linux Terminal - Available Commands:

NAVIGATION:
  ls [PATH]         List directory contents
  cd [PATH]         Change directory
  pwd               Print working directory
  tree [PATH]       Display directory tree

FILE OPERATIONS:
  cat FILE          Display file contents
  touch FILE        Create empty file
  mkdir DIR         Create directory
  rm FILE           Remove file or directory (-r for recursive)
  rmdir DIR         Remove empty directory
  cp SRC DEST       Copy file
  mv SRC DEST       Move or rename file
  nano FILE         Edit a file (^O save, ^X exit, ^G help)

TEXT PROCESSING:
  echo TEXT         Display text
  CMD > FILE        Write a command's output to a file (>> appends)
  grep PATTERN FILE Search for pattern in file
  find [PATH]       Search for files

PERMISSIONS:
  chmod MODE FILE   Change file permissions (use octal: 755, 644, etc.)

SYSTEM:
  ps                Show processes
  whoami            Print current user
  date              Display date and time
  uname             Print system information
  clear             Clear terminal screen
  history           Show commands you've run

HELP:
  help              Show this help message

TIPS:
  Tab               Complete commands and file names (Tab twice lists options)
  Up / Down         Scroll through previous commands
  Ctrl+C            Cancel the current line

Use --help flag with any command for more information.
`;

    return { output: helpText.trim(), error: false };
  },
};

/**
 * man - Manual pages (simplified version)
 */
export const manCommand: Command = {
  name: "man",
  description: "Display manual page for a command",
  usage: "man COMMAND",
  execute: (context): CommandResult => {
    if (context.args.length === 0) {
      return { output: "What manual page do you want?\nFor example, try: man ls", error: true };
    }

    const command = context.args[0];
    const manPages: { [key: string]: string } = {
      nano: `
NANO(1)                         User Commands                        NANO(1)

NAME
       nano - a small, friendly text editor

SYNOPSIS
       nano [FILE]

DESCRIPTION
       Opens FILE for editing (a new file is created when you save if it
       doesn't exist). The bottom two lines list the main shortcuts;
       ^ means the Ctrl key.

       ^O   Write Out (save, confirm the file name with Enter)
       ^S   Save to the current file
       ^X   Exit (asks whether to save changes)
       ^K   Cut the current line      ^U   Paste
       ^F   Search                    ^C   Show cursor position
       ^G   Help

EXAMPLES
       nano notes.txt
              Edit (or create) notes.txt in the current directory
`,
      ls: `
LS(1)                           User Commands                          LS(1)

NAME
       ls - list directory contents

SYNOPSIS
       ls [OPTION]... [FILE]...

DESCRIPTION
       List information about the FILEs (the current directory by default).

       -a, --all
              do not ignore entries starting with .

       -l     use a long listing format

EXAMPLES
       ls
              List files in current directory

       ls -l
              Long format with permissions and details

       ls /home
              List files in /home directory
`,
      cd: `
CD(1)                           User Commands                          CD(1)

NAME
       cd - change directory

SYNOPSIS
       cd [DIRECTORY]

DESCRIPTION
       Change the current working directory to DIRECTORY.
       If no directory is specified, changes to home directory (/home/user).

EXAMPLES
       cd /home
              Change to /home directory

       cd ..
              Go up one directory level

       cd ~
              Go to home directory
`,
      pwd: `
PWD(1)                          User Commands                         PWD(1)

NAME
       pwd - print name of current/working directory

SYNOPSIS
       pwd

DESCRIPTION
       Print the full filename of the current working directory.
`,
      cat: `
CAT(1)                          User Commands                         CAT(1)

NAME
       cat - concatenate files and print on standard output

SYNOPSIS
       cat [FILE]...

DESCRIPTION
       Concatenate FILE(s) to standard output.

EXAMPLES
       cat file.txt
              Display contents of file.txt

       cat file1.txt file2.txt
              Display contents of multiple files
`,
      chmod: `
CHMOD(1)                        User Commands                       CHMOD(1)

NAME
       chmod - change file permissions

SYNOPSIS
       chmod MODE FILE

DESCRIPTION
       Change the file mode (permissions) of FILE to MODE.
       MODE should be a 3-digit octal number (e.g., 755, 644).

       Permission values:
       0 = --- (no permissions)
       1 = --x (execute only)
       2 = -w- (write only)
       3 = -wx (write and execute)
       4 = r-- (read only)
       5 = r-x (read and execute)
       6 = rw- (read and write)
       7 = rwx (read, write, and execute)

EXAMPLES
       chmod 755 script.sh
              rwxr-xr-x (owner: all, group: read+execute, others: read+execute)

       chmod 644 file.txt
              rw-r--r-- (owner: read+write, group: read, others: read)
`,
    };

    const manPage = manPages[command];
    if (!manPage) {
      return { output: `No manual entry for ${command}`, error: true };
    }

    return { output: manPage.trim(), error: false };
  },
};
