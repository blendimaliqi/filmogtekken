function NavItems() {
  return (
    <div className="absolute top-0 right-0 w-full z-[90000] h-screen bg-white p-8 transition duration-300 ease-in-out transform">
      <ul className="text-base text-gray-300 space-y-4 z-[90000]">
        <li>
          <a href="#">Item 1</a>
        </li>
        <li>
          <a href="#">Item 2</a>
        </li>
        <li>
          <a href="#">Item 3</a>
        </li>
      </ul>
    </div>
  );
}

export default NavItems;
