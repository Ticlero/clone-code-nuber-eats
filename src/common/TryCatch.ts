export function TryCatch(msg: string) {
  return function (target: any, key: string, desc: PropertyDescriptor) {
    const originFn = desc.value;
    console.log(desc, msg);
    desc.value = async function (...args: any[]) {
      console.log('asdjasd', ...args);
      try {
        return await originFn.apply(this, args);
      } catch (e) {
        return {
          ok: false,
          error: msg,
        };
      }
    };
  };
}
