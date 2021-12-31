

export function useDomain() {
  const domainName = window.location.hostname;
  let env = 'master';
  if (domainName.includes('localhost')) env = 'local';
  if (domainName === 'demo.snapshot.org') env = 'develop';
  let domain = "";

  

  const alias = "";

  return { domain, alias, env };
}
