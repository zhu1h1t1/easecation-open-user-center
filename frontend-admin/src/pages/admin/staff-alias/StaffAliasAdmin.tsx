import StaffAliasAdminPublic from './StaffAliasAdmin.public';

const privateModules = import.meta.glob('./StaffAliasAdmin.private.tsx', { eager: true }) as Record<
    string,
    { default?: typeof StaffAliasAdminPublic }
>;

const StaffAliasAdmin = Object.values(privateModules)[0]?.default ?? StaffAliasAdminPublic;

export default StaffAliasAdmin;
