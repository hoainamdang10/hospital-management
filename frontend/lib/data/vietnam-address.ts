// Vietnam Address Data for Registration Form
export interface Province {
  code: string;
  name: string;
  districts: District[];
}

export interface District {
  code: string;
  name: string;
  wards: Ward[];
}

export interface Ward {
  code: string;
  name: string;
}

// Comprehensive Vietnam provinces data
export const VIETNAM_PROVINCES: Province[] = [
  {
    code: "01",
    name: "Hà Nội",
    districts: [
      {
        code: "001",
        name: "Ba Đình",
        wards: [
          { code: "00001", name: "Phúc Xá" },
          { code: "00002", name: "Trúc Bạch" },
          { code: "00003", name: "Vĩnh Phúc" },
          { code: "00004", name: "Cống Vị" },
          { code: "00005", name: "Liễu Giai" },
          { code: "00006", name: "Nguyễn Trung Trực" },
          { code: "00007", name: "Quán Thánh" },
          { code: "00008", name: "Ngọc Hà" },
          { code: "00009", name: "Điện Biên" },
          { code: "00010", name: "Đội Cấn" },
          { code: "00011", name: "Ngọc Khánh" },
          { code: "00012", name: "Kim Mã" },
          { code: "00013", name: "Giảng Võ" },
          { code: "00014", name: "Thành Công" },
        ],
      },
      {
        code: "002",
        name: "Hoàn Kiếm",
        wards: [
          { code: "00015", name: "Phan Chu Trinh" },
          { code: "00016", name: "Tràng Tiền" },
          { code: "00017", name: "Trần Hưng Đạo" },
          { code: "00018", name: "Chương Dương Độ" },
          { code: "00019", name: "Lý Thái Tổ" },
          { code: "00020", name: "Hàng Bài" },
          { code: "00021", name: "Hàng Bồ" },
          { code: "00022", name: "Hàng Gai" },
          { code: "00023", name: "Đồng Xuân" },
          { code: "00024", name: "Cửa Nam" },
          { code: "00025", name: "Hàng Mã" },
          { code: "00026", name: "Hàng Buồm" },
          { code: "00027", name: "Hàng Đào" },
          { code: "00028", name: "Hàng Trống" },
          { code: "00029", name: "Cửa Đông" },
          { code: "00030", name: "Phúc Tân" },
          { code: "00031", name: "Hàng Bạc" },
          { code: "00032", name: "Hàng Bông" },
        ],
      },
      {
        code: "003",
        name: "Hai Bà Trưng",
        wards: [
          { code: "00033", name: "Nguyễn Du" },
          { code: "00034", name: "Bạch Đằng" },
          { code: "00035", name: "Phạm Đình Hổ" },
          { code: "00036", name: "Lê Đại Hành" },
          { code: "00037", name: "Đống Mác" },
          { code: "00038", name: "Phố Huế" },
          { code: "00039", name: "Đồng Nhân" },
          { code: "00040", name: "Thanh Lương" },
          { code: "00041", name: "Thanh Nhàn" },
          { code: "00042", name: "Cầu Dền" },
          { code: "00043", name: "Bách Khoa" },
          { code: "00044", name: "Đồng Tâm" },
          { code: "00045", name: "Vĩnh Tuy" },
          { code: "00046", name: "Bạch Mai" },
          { code: "00047", name: "Quỳnh Mai" },
          { code: "00048", name: "Quỳnh Lôi" },
          { code: "00049", name: "Minh Khai" },
          { code: "00050", name: "Trương Định" },
        ],
      },
      {
        code: "004",
        name: "Đống Đa",
        wards: [
          { code: "00051", name: "Cát Linh" },
          { code: "00052", name: "Văn Miếu" },
          { code: "00053", name: "Quốc Tử Giám" },
          { code: "00054", name: "Láng Thượng" },
          { code: "00055", name: "Ô Chợ Dừa" },
          { code: "00056", name: "Văn Chương" },
          { code: "00057", name: "Hàng Bột" },
          { code: "00058", name: "Nam Đồng" },
          { code: "00059", name: "Trung Liệt" },
          { code: "00060", name: "Thổ Quan" },
          { code: "00061", name: "Khâm Thiên" },
          { code: "00062", name: "Phương Liên" },
          { code: "00063", name: "Phương Mai" },
          { code: "00064", name: "Ngã Tư Sở" },
          { code: "00065", name: "Khương Thượng" },
          { code: "00066", name: "Láng Hạ" },
          { code: "00067", name: "Thành Công" },
          { code: "00068", name: "Kim Liên" },
          { code: "00069", name: "Phúc Đồng" },
          { code: "00070", name: "Trung Phụng" },
          { code: "00071", name: "Quang Trung" },
        ],
      },
      {
        code: "005",
        name: "Tây Hồ",
        wards: [
          { code: "00072", name: "Phú Thượng" },
          { code: "00073", name: "Nhật Tân" },
          { code: "00074", name: "Tứ Liên" },
          { code: "00075", name: "Quảng An" },
          { code: "00076", name: "Xuân La" },
          { code: "00077", name: "Yên Phụ" },
          { code: "00078", name: "Bưởi" },
          { code: "00079", name: "Thụy Khuê" },
        ],
      },
      {
        code: "006",
        name: "Long Biên",
        wards: [
          { code: "00080", name: "Thượng Thanh" },
          { code: "00081", name: "Ngọc Thụy" },
          { code: "00082", name: "Giang Biên" },
          { code: "00083", name: "Đức Giang" },
          { code: "00084", name: "Việt Hưng" },
          { code: "00085", name: "Gia Thụy" },
          { code: "00086", name: "Ngọc Lâm" },
          { code: "00087", name: "Phúc Lợi" },
          { code: "00088", name: "Bồ Đề" },
          { code: "00089", name: "Sài Đồng" },
          { code: "00090", name: "Long Biên" },
          { code: "00091", name: "Thạch Bàn" },
          { code: "00092", name: "Phúc Đông" },
          { code: "00093", name: "Cu Khối" },
        ],
      },
    ],
  },
  {
    code: "79",
    name: "Thành phố Hồ Chí Minh",
    districts: [
      {
        code: "760",
        name: "Quận 1",
        wards: [
          { code: "26734", name: "Tân Định" },
          { code: "26737", name: "Đa Kao" },
          { code: "26740", name: "Bến Nghé" },
          { code: "26743", name: "Bến Thành" },
          { code: "26746", name: "Nguyễn Thái Bình" },
        ],
      },
      {
        code: "761",
        name: "Quận 3",
        wards: [
          { code: "26749", name: "Võ Thị Sáu" },
          { code: "26752", name: "Đa Kao" },
          { code: "26755", name: "Nguyễn Cư Trinh" },
          { code: "26758", name: "Nguyễn Thái Bình" },
          { code: "26761", name: "Phạm Ngũ Lão" },
        ],
      },
      {
        code: "764",
        name: "Quận 7",
        wards: [
          { code: "26764", name: "Tân Thuận Đông" },
          { code: "26767", name: "Tân Thuận Tây" },
          { code: "26770", name: "Tân Kiểng" },
          { code: "26773", name: "Tân Hưng" },
          { code: "26776", name: "Bình Thuận" },
        ],
      },
    ],
  },
  {
    code: "48",
    name: "Đà Nẵng",
    districts: [
      {
        code: "490",
        name: "Hải Châu",
        wards: [
          { code: "20194", name: "Thạch Thang" },
          { code: "20197", name: "Hải Châu I" },
          { code: "20200", name: "Hải Châu II" },
          { code: "20203", name: "Phước Ninh" },
          { code: "20206", name: "Hòa Thuận Tây" },
        ],
      },
      {
        code: "491",
        name: "Thanh Khê",
        wards: [
          { code: "20209", name: "Tam Thuận" },
          { code: "20212", name: "Thanh Khê Tây" },
          { code: "20215", name: "Thanh Khê Đông" },
          { code: "20218", name: "Xuân Hà" },
          { code: "20221", name: "Tân Chính" },
        ],
      },
    ],
  },
  {
    code: "92",
    name: "Cần Thơ",
    districts: [
      {
        code: "916",
        name: "Ninh Kiều",
        wards: [
          { code: "31117", name: "Cái Khế" },
          { code: "31120", name: "An Hòa" },
          { code: "31123", name: "Thới Bình" },
          { code: "31126", name: "An Nghiệp" },
          { code: "31129", name: "An Cư" },
        ],
      },
    ],
  },
];

// Helper functions
export const getProvinceByCode = (code: string): Province | undefined => {
  return VIETNAM_PROVINCES.find((province) => province.code === code);
};

export const getDistrictByCode = (
  provinceCode: string,
  districtCode: string
): District | undefined => {
  const province = getProvinceByCode(provinceCode);
  return province?.districts.find((district) => district.code === districtCode);
};

export const getWardByCode = (
  provinceCode: string,
  districtCode: string,
  wardCode: string
): Ward | undefined => {
  const district = getDistrictByCode(provinceCode, districtCode);
  return district?.wards.find((ward) => ward.code === wardCode);
};

// Get options for dropdowns
export const getProvinceOptions = () => {
  return VIETNAM_PROVINCES.map((province) => ({
    value: province.code,
    label: province.name,
  }));
};

export const getDistrictOptions = (provinceCode: string) => {
  const province = getProvinceByCode(provinceCode);
  return (
    province?.districts.map((district) => ({
      value: district.code,
      label: district.name,
    })) || []
  );
};

export const getWardOptions = (provinceCode: string, districtCode: string) => {
  const district = getDistrictByCode(provinceCode, districtCode);
  return (
    district?.wards.map((ward) => ({
      value: ward.code,
      label: ward.name,
    })) || []
  );
};
