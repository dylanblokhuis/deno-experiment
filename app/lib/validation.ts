const stringToPathArray = <T extends string>(
  path: T
): (string | number)[] => {
  if (path.length === 0) return [];

  const match =
    path.match(/^\[(.+?)\](.*)$/) || path.match(/^\.?([^\.\[\]]+)(.*)$/);
  if (match) {
    const [_, key, rest] = match;
    return [/^\d+$/.test(key) ? Number(key) : key, ...stringToPathArray(rest)];
  }
  return [path];
};


function setPath<T>(object: T, path: string, defaultValue: any) {
  return _setPathNormalized(object, stringToPathArray(path), defaultValue);
}

function _setPathNormalized(
  object: any,
  path: (string | number)[],
  value: any
): any {
  const leadingSegments = path.slice(0, -1);
  const lastSegment = path[path.length - 1];

  let obj = object;
  for (let i = 0; i < leadingSegments.length; i++) {
    const segment = leadingSegments[i];
    if (obj[segment] === undefined) {
      const nextSegment = leadingSegments[i + 1] ?? lastSegment;
      obj[segment] = typeof nextSegment === "number" ? [] : {};
    }
    obj = obj[segment];
  }
  obj[lastSegment] = value;
  return object;
}


export function formDataToObject(formData: FormData) {
  const map: Map<string, unknown[]> = new Map();
  for (const [key, value] of formData.entries()) {
    if (map.has(key)) {
      map.get(key)!.push(String(value));
    } else {
      map.set(key, [value]);
    }
  }

  return [...map.entries()].reduce((acc, [key, value]) => {
    return setPath(acc, key, value.length === 1 ? value[0] : value);
  }, {} as Record<string, unknown | unknown[]>);
}