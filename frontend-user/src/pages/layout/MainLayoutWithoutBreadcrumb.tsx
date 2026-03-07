import MainLayoutComponent from './components/MainLayoutComponent';

const MainLayoutWithoutBreadcrumb = () => {
    return MainLayoutComponent({ breadcrumbItems: [] });
};

export default MainLayoutWithoutBreadcrumb;
