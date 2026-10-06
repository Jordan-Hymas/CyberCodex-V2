import { FileSystem, FileSystemNode } from "./types";

export const HOME_DIR = "/home/user";

/**
 * Virtual filesystem manager for terminal emulator
 * Provides in-memory filesystem operations
 */
export class VirtualFileSystem {
  private fs: FileSystem;

  constructor(initialFs?: FileSystem) {
    this.fs = initialFs || this.createDefaultFilesystem();
  }

  /**
   * Create default filesystem structure for Linux training
   */
  private createDefaultFilesystem(): FileSystem {
    const now = new Date();
    return {
      "/": { type: "directory", permissions: "drwxr-xr-x", owner: "root", modified: now },
      "/home": { type: "directory", permissions: "drwxr-xr-x", owner: "root", modified: now },
      "/home/user": { type: "directory", permissions: "drwxr-xr-x", owner: "user", modified: now },
      "/home/user/welcome.txt": {
        type: "file",
        content: "Welcome to CyberCodex Linux Terminal!\nType 'help' to see available commands.\n",
        permissions: "-rw-r--r--",
        owner: "user",
        size: 75,
        modified: now,
      },
      "/home/user/documents": { type: "directory", permissions: "drwxr-xr-x", owner: "user", modified: now },
      "/home/user/downloads": { type: "directory", permissions: "drwxr-xr-x", owner: "user", modified: now },
      "/etc": { type: "directory", permissions: "drwxr-xr-x", owner: "root", modified: now },
      "/var": { type: "directory", permissions: "drwxr-xr-x", owner: "root", modified: now },
      "/tmp": { type: "directory", permissions: "drwxrwxrwx", owner: "root", modified: now },
    };
  }

  /**
   * Get filesystem state
   */
  getFilesystem(): FileSystem {
    return this.fs;
  }

  /**
   * Update filesystem state
   */
  setFilesystem(fs: FileSystem): void {
    this.fs = fs;
  }

  /**
   * Resolve a path (absolute, relative, or ~) against the current directory
   */
  resolvePath(currentDir: string, path: string): string {
    if (path === "~" || path.startsWith("~/")) {
      path = HOME_DIR + path.slice(1);
    }
    return this.normalizePath(path.startsWith("/") ? path : `${currentDir}/${path}`);
  }

  /**
   * Normalize a path: collapse slashes and resolve "." and ".." segments
   */
  normalizePath(path: string): string {
    const parts: string[] = [];
    for (const part of path.split("/")) {
      if (!part || part === ".") continue;
      if (part === "..") parts.pop();
      else parts.push(part);
    }
    return "/" + parts.join("/");
  }

  /**
   * Check if path exists
   */
  exists(path: string): boolean {
    return path in this.fs;
  }

  /**
   * Check if path is a directory
   */
  isDirectory(path: string): boolean {
    return this.exists(path) && this.fs[path].type === "directory";
  }

  /**
   * Check if path is a file
   */
  isFile(path: string): boolean {
    return this.exists(path) && this.fs[path].type === "file";
  }

  /**
   * Get node at path
   */
  getNode(path: string): FileSystemNode | null {
    return this.fs[path] || null;
  }

  /**
   * List directory contents
   */
  readdir(path: string): string[] {
    if (!this.isDirectory(path)) {
      throw new Error(`${path}: Not a directory`);
    }

    const normalizedPath = this.normalizePath(path);
    const prefix = normalizedPath === "/" ? "/" : normalizedPath + "/";

    const entries = Object.keys(this.fs)
      .filter((p) => {
        if (p === normalizedPath) return false;
        if (!p.startsWith(prefix)) return false;

        const relativePath = p.slice(prefix.length);
        return !relativePath.includes("/");
      })
      .map((p) => {
        const name = p.split("/").filter(Boolean).pop() || "";
        return name;
      });

    return entries.sort();
  }

  /**
   * Read file contents
   */
  readFile(path: string): string {
    if (!this.isFile(path)) {
      throw new Error(`${path}: Not a file`);
    }

    return this.fs[path].content || "";
  }

  /**
   * Write file contents
   */
  writeFile(path: string, content: string): void {
    const now = new Date();

    this.fs[path] = {
      type: "file",
      content,
      permissions: "-rw-r--r--",
      owner: "user",
      size: content.length,
      modified: now,
    };
  }

  /**
   * Create directory
   */
  mkdir(path: string): void {
    if (this.exists(path)) {
      throw new Error(`${path}: File exists`);
    }

    const parentPath = path.split("/").slice(0, -1).join("/") || "/";
    if (!this.isDirectory(parentPath)) {
      throw new Error(`${parentPath}: No such file or directory`);
    }

    this.fs[path] = {
      type: "directory",
      permissions: "drwxr-xr-x",
      owner: "user",
      modified: new Date(),
    };
  }

  /**
   * Remove file or directory
   */
  remove(path: string): void {
    if (!this.exists(path)) {
      throw new Error(`${path}: No such file or directory`);
    }

    if (this.isDirectory(path)) {
      const contents = this.readdir(path);
      if (contents.length > 0) {
        throw new Error(`${path}: Directory not empty`);
      }
    }

    delete this.fs[path];
  }

  /**
   * Copy file
   */
  copy(source: string, dest: string): void {
    if (!this.isFile(source)) {
      throw new Error(`${source}: No such file`);
    }

    if (this.exists(dest) && this.isDirectory(dest)) {
      const filename = source.split("/").pop() || "";
      dest = this.normalizePath(dest + "/" + filename);
    }

    const content = this.readFile(source);
    this.writeFile(dest, content);
  }

  /**
   * Move/rename file or directory
   */
  move(source: string, dest: string): void {
    if (!this.exists(source)) {
      throw new Error(`${source}: No such file or directory`);
    }

    if (this.exists(dest) && this.isDirectory(dest)) {
      const filename = source.split("/").pop() || "";
      dest = this.normalizePath(dest + "/" + filename);
    }

    this.fs[dest] = { ...this.fs[source] };
    delete this.fs[source];
  }

  /**
   * Get file/directory permissions
   */
  getPermissions(path: string): string {
    const node = this.getNode(path);
    return node?.permissions || "----------";
  }

  /**
   * Set file/directory permissions
   */
  setPermissions(path: string, permissions: string): void {
    if (!this.exists(path)) {
      throw new Error(`${path}: No such file or directory`);
    }

    this.fs[path].permissions = permissions;
  }
}
